import test from 'node:test';
import assert from 'node:assert/strict';
import { createCapacityRequest, evaluateCapacity } from '../dist/trip-planner-capacity.js';
import { initialTripPlannerState, tripPlannerPrompts } from '../dist/trip-planner.js';
import { createTripPlannerRequest } from '../dist/trip-planner-records.js';
import { stays } from '../dist/catalog.js';
import { initialTripLesson, tripLessonReducer as reduce } from '../dist/trip-planner-lesson.js';

const identity = (suffix) => ({ sessionId: `session-${suffix}`, traceId: `trace-${suffix}`, generationId: `generation-${suffix}`, startedAt: 1000 });
const request = (fixed = false, catalog = stays) => createCapacityRequest(catalog, identity(fixed ? 'after' : 'before'), fixed ? 'capacity-fixed' : 'capacity-broken');

test('missing guest filter produces an undersized recommendation without a model-call error', () => {
  const {record, state} = request();
  const {lookup, evaluation} = record.capacityEvidence;
  assert.deepEqual(lookup.properties.$ai_input_state, {setting: 'City'});
  assert.equal(lookup.properties.$ai_output_state[0].capacity, 2);
  assert.equal(state.selectedStayId, 'stay-03');
  assert.equal(record.properties.$ai_is_error, false);
  assert.equal(evaluation.result, 'fail');
  assert.match(evaluation.reason, /sleeps 2.*asked for 4/);
  assert.equal(evaluation.generationId, record.properties.$ai_span_id);
  assert.equal(lookup.properties.$ai_trace_id, record.properties.$ai_trace_id);
  assert.equal(lookup.properties.$ai_session_id, record.properties.$ai_session_id);
  assert.equal(record.properties.$ai_output_choices[0].content, state.turns[0].reply);
  assert.ok(record.properties.$ai_input.some(message => message.content.includes(JSON.stringify(lookup.properties.$ai_output_state))));
});

test('fix really filters catalog matches instead of merely replacing the answer or evaluation', () => {
  const after = request(true);
  assert.deepEqual(after.record.capacityEvidence.lookup.properties.$ai_input_state, {setting: 'City', guests: 4});
  assert.deepEqual(after.record.capacityEvidence.lookup.properties.$ai_output_state, []);
  assert.equal(after.state.selectedStayId, null);
  assert.match(after.state.turns[0].reply, /isn’t a city stay for four/);
  assert.equal(after.record.capacityEvidence.evaluation.result, 'pass');
  // A changed catalog must produce a matching recommendation instead of a hardcoded refusal.
  const largerCity = stays.map(stay => stay.id === 'stay-03' ? {...stay, capacity: 5} : stay);
  const changed = request(true, largerCity);
  assert.equal(changed.state.selectedStayId, 'stay-03');
  assert.equal(changed.record.capacityEvidence.lookup.properties.$ai_output_state[0].capacity, 5);
  assert.equal(changed.record.capacityEvidence.evaluation.result, 'pass');
  assert.equal(stays.find(stay => stay.id === 'stay-03').capacity, 2);
  assert.equal(evaluateCapacity({id:'unknown', name:'Unknown', capacity:null}, 4).result, 'not-applicable');
});

test('website failure is recorded before the lab and investigated after instrumentation', () => {
  let chat = initialTripPlannerState();
  let lesson = initialTripLesson;
  let last;
  for (const prompt of [tripPlannerPrompts.forest, tripPlannerPrompts.beach, tripPlannerPrompts.kitchen, 'Find me a city stay for four.']) {
    last = createTripPlannerRequest(chat, prompt, stays, {...identity(String(chat.turns.length)), sessionId:'website'});
    chat = last.state;
    lesson = reduce(lesson, {type:'record', record:last.record});
  }
  assert.equal(chat.turns.length, 4);
  assert.equal(chat.stage, 'complete');
  assert.equal(last.record.properties.turn_number, 4);
  assert.equal(last.record.properties.$ai_input.at(-1).content, 'Find me a city stay for four.');
  assert.ok(last.record.properties.$ai_input.some(message => message.content === tripPlannerPrompts.forest));
  assert.equal(last.record.capacityEvidence.evaluation.result, 'fail');
  assert.equal(lesson.step, 0);
  assert.equal(lesson.evidence.length, 2);
  assert.equal(lesson.failureEvidence.length, 1);
  assert.equal(reduce(lesson, {type:'apply-capacity-fix'}), lesson);
  lesson = reduce(lesson, {type:'next'});
  lesson = reduce(lesson, {type:'next'}); // Continue from the complete capture call.
  lesson = reduce(lesson, {type:'field', value:'output'});
  lesson = reduce(lesson, {type:'next'}); // View the session linking both requests.
  lesson = reduce(lesson, {type:'next'});
  assert.equal(lesson.step, 2); // Review remains available even when failure was recorded early.
  assert.equal(reduce(lesson, {type:'apply-capacity-fix'}), lesson);
  lesson = reduce(lesson, {type:'next'});
  assert.equal(lesson.step, 3);
  const foundation = lesson.evidence;
  assert.equal(reduce(lesson, {type:'previous'}).step, 2);
  lesson = reduce(lesson, {type:'next'});
  assert.equal(lesson.step, 4);
  assert.equal(reduce(lesson, {type:'apply-capacity-fix'}), lesson);
  assert.equal(lesson.investigation, 'overview');
  lesson = reduce(lesson, {type:'next'});
  assert.equal(lesson.investigation, 'lookup');
  lesson = reduce(lesson, {type:'next'});
  assert.equal(lesson.investigation, 'fix');
  lesson = reduce(lesson, {type:'apply-capacity-fix'});
  assert.equal(lesson.step, 4);
  assert.equal(lesson.capacityFixed, true);
  assert.equal(reduce(lesson, {type:'next'}), lesson);
  const after = request(true).record;
  lesson = reduce(lesson, {type:'record', record:after});
  assert.deepEqual(lesson.failureEvidence, [last.record, after]);
  assert.deepEqual(lesson.evidence, foundation);
  lesson = reduce(lesson, {type:'next'});
  assert.equal(lesson.step, 4);
  assert.equal(lesson.investigation, 'evaluation');
  assert.equal(reduce(lesson, {type:'next'}).step, 5);
  assert.equal(reduce(lesson, {type:'reset'}), initialTripLesson);
});
