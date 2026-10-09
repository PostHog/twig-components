import test from 'node:test';
import assert from 'node:assert/strict';
import { eventsReducer as reduce, initialEventsState, currentEvents, destinationCounts, canContinue, captureCode, hasCurrentAgentReply, needsConfiguration, eventInspectionRequest, eventTrendsRequest } from '../dist/events-lab.js';
const click = (setting = 'Forest', count = 1) => ({ type: 'click', setting, count, timestamp: '2026-09-28T12:00:00Z' });
const inspect = state => reduce(state, { type: 'inspect', id: currentEvents(state).at(-1).id });
const next = { type: 'next' };
const configure = { type: 'configure' };
for (const path of ['web', 'mcp']) test(`${path}: real clicks, tracking changes and evidence are required throughout`, () => {
  let state = reduce(initialEventsState, { type: 'path', path });
  assert.equal(state.step, 1);
  assert.equal(canContinue(state), false);
  state = reduce(state, click());
  assert.equal(state.step, 1, 'clicking does not auto-advance the lesson');
  assert.equal(currentEvents(state)[0].event, '$autocapture');
  assert.equal(canContinue(state), false, 'evidence must be read');
  state = reduce(inspect(state), next);
  assert.equal(state.step, 2);
  assert.equal(needsConfiguration(state), true);
  assert.equal(reduce(state, click()), state, 'cannot collect a new event before enabling tracking');
  state = reduce(reduce(state, configure), click());
  assert.deepEqual(currentEvents(state)[0].properties, {});
  state = reduce(inspect(state), next);
  state = reduce(reduce(state, configure), click());
  assert.equal(currentEvents(state)[0].properties.destination_type, 'Forest');
  assert.equal(canContinue(inspect(state)), false, 'must compare two property values');
  state = reduce(state, click('Coast'));
  state = reduce(inspect(state), next);
  state = reduce(reduce(state, configure), click('Forest', 0));
  assert.deepEqual(currentEvents(state)[0].properties, { destination_type: 'Forest', results_count: 0, has_results: false });
  state = reduce(state, click('Coast', 2));
  state = reduce(inspect(state), next);
  assert.equal(state.step, 5);
  assert.deepEqual(destinationCounts(currentEvents(state)), [{ destination: 'Forest', count: 1 }, { destination: 'Coast', count: 1 }]);
  assert.equal(canContinue(state), false, 'compare before finishing');
  state = reduce(state, { type: 'answer', correct: true });
  assert.equal(canContinue(state), true);
  state = reduce(state, click('Coast', 2));
  assert.equal(canContinue(state), false, 'new data invalidates an earlier agent answer');
  state = reduce(state, { type: 'answer', correct: true });
  state = reduce(state, next);
  assert.equal(state.step, 6, 'comparison leads straight to completion');
  assert.equal(reduce(state, click()), state, 'completion does not collect more events');
});
test('switching experiences keeps clicks, configuration, and current task; reset clears them', () => {
  let state = reduce(initialEventsState, { type: 'path', path: 'web' });
  state = reduce(inspect(reduce(state, click())), next);
  state = reduce(reduce(state, configure), click());
  const switched = reduce(state, { type: 'path', path: 'mcp' });
  assert.equal(switched.step, 2);
  assert.equal(switched.events, state.events);
  assert.deepEqual(switched.configured, [2]);
  const back = reduce(switched, { type: 'previous' });
  assert.equal(currentEvents(back)[0].event, '$autocapture');
  const reset = reduce(switched, { type: 'reset' });
  assert.equal(reset.step, 0);
  assert.deepEqual(reset.events, []);
  assert.deepEqual(reset.configured, []);
  assert.equal(reset.revision, 1);
});
test('switching from Web app to Agent at comparison requires an agent reply', () => {
  const comparisonEvent = { id: '0-4-1', timestamp: '2026-09-28T12:00:00Z', event: 'stay_filter_selected', properties: { destination_type: 'Forest', results_count: 1, has_results: true } };
  const webState = { ...initialEventsState, path: 'web', step: 5, events: [comparisonEvent], answered: true };
  assert.equal(canContinue(webState), true);
  const agentState = reduce(webState, { type: 'path', path: 'mcp' });
  assert.equal(agentState.answered, false);
  assert.equal(canContinue(agentState), false);
  assert.equal(hasCurrentAgentReply(agentState, [comparisonEvent.id]), false);
  const answeredAgentState = reduce(agentState, { type: 'answer', correct: true });
  assert.equal(canContinue(answeredAgentState), true);
  assert.equal(reduce(answeredAgentState, { type: 'path', path: 'mcp' }), answeredAgentState, 'selecting the active experience keeps its answer');
});
test('invalid clicks cannot invent evidence', () => {
  const state = reduce(initialEventsState, { type: 'path', path: 'web' });
  for (const action of [click('Unknown'), click('Forest', -1), { ...click(), timestamp: 'invalid' }]) assert.equal(reduce(state, action), state);
  assert.equal(reduce(state, { type: 'inspect', id: 'not-real' }), state);
});
test('Previous offers a fresh agent reply even when an old reply remains in the transcript', () => {
  let state = reduce(initialEventsState, { type: 'path', path: 'mcp' });
  state = inspect(reduce(state, click()));
  const firstEventId = currentEvents(state)[0].id;
  assert.equal(hasCurrentAgentReply(state, [firstEventId]), true);
  state = reduce(reduce(state, next), { type: 'previous' });
  assert.equal(canContinue(state), false);
  assert.equal(hasCurrentAgentReply(state, [firstEventId]), false);
  assert.equal(hasCurrentAgentReply(inspect(state), [firstEventId]), true);

  const comparisonEvent = { id: '0-4-1', timestamp: '2026-09-28T12:00:00Z', event: 'stay_filter_selected', properties: { destination_type: 'Forest', results_count: 1, has_results: true } };
  const comparison = { ...state, step: 5, events: [comparisonEvent], answered: true };
  assert.equal(hasCurrentAgentReply(comparison, [comparisonEvent.id]), true);
  const backFromCompletion = reduce(reduce(comparison, next), { type: 'previous' });
  assert.equal(backFromCompletion.step, 5);
  assert.equal(hasCurrentAgentReply(backFromCompletion, [comparisonEvent.id]), false);
});
test('All locations clears the filter without becoming a destination event', () => {
  let state = { ...initialEventsState, step: 3, configured: [2, 3] };
  state = reduce(state, click('Forest'));
  assert.equal(reduce(state, click('All')), state);
  assert.equal(canContinue(inspect(state)), false, 'All plus one destination is not two destinations');
  state = reduce(state, click('Coast'));
  assert.equal(canContinue(inspect(state)), true);
  state = reduce(inspect(state), next);
  state = reduce(state, configure);
  assert.equal(reduce(state, click('All')), state);
  state = reduce(state, click('City'));
  assert.deepEqual(destinationCounts(currentEvents(state)), [{ destination: 'City', count: 1 }]);
  assert.deepEqual(destinationCounts([{ properties: { destination_type: 'All' } }]), []);
});
test('the teaching code records destinations and skips All locations', () => {
  for (const step of [3, 4]) {
    const captured = [];
    const track = new Function('posthog', `${captureCode[step]}\nreturn track;`)({ capture: (...args) => captured.push(args) });
    track('All', [{}, {}]);
    assert.deepEqual(captured, []);
    track('Forest', [{}, {}]);
    assert.deepEqual(captured, step === 3
      ? [['stay_filter_selected', { destination_type: 'Forest' }]]
      : [['stay_filter_selected', { destination_type: 'Forest', results_count: 2, has_results: true }]]);
  }
});

test('MCP requests use the current PostHog input contracts', () => {
  const events = [
    { id: '0-4-1', event: 'stay_filter_selected', timestamp: '2026-09-28T12:00:00.000Z', properties: { destination_type: 'Forest' } },
    { id: '0-4-2', event: 'stay_filter_selected', timestamp: '2026-09-28T12:01:00.000Z', properties: { destination_type: 'Coast' } },
  ];
  const trends = eventTrendsRequest(events);
  assert.deepEqual(trends.breakdownFilter, { breakdowns: [{ property: 'destination_type', type: 'event' }] });
  assert.deepEqual(trends.series, [{ kind: 'EventsNode', event: 'stay_filter_selected', math: 'total' }]);
  assert.deepEqual(trends.dateRange, { date_from: events[0].timestamp, date_to: '2026-09-28T12:01:00.001Z' });
  for (const event of ['$autocapture', 'stay_filter_selected']) {
    const request = eventInspectionRequest(events.map(row => ({ ...row, event })));
    assert.deepEqual(Object.keys(request), ['query']);
    assert.ok(request.query.includes(`event = '${event}'`));
    assert.ok(request.query.includes(`timestamp >= '${events[0].timestamp}'`));
    assert.ok(request.query.includes("timestamp < '2026-09-28T12:01:00.001Z'"));
    assert.ok(request.query.endsWith('ORDER BY timestamp DESC LIMIT 1'));
  }
  assert.throws(() => eventInspectionRequest([]));
  assert.throws(() => eventTrendsRequest([]));
});
