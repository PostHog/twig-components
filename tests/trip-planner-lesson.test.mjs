import test from "node:test";
import assert from "node:assert/strict";
import { initialTripLesson, tripLessonReducer as reduce } from "../dist/trip-planner-lesson.js";
import { createTripPlannerRequest } from "@posthog/twig-components/trip-planner-records";
import { initialTripPlannerState, tripPlannerPrompts } from "@posthog/twig-components/trip-planner-state";
import { stays } from "@posthog/twig-components/catalog";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TripPlannerLabProvider, TripPlannerWalkthrough } from "@posthog/twig-components/trip-planner-lab";

function requests(sessionId) {
  const first = createTripPlannerRequest(initialTripPlannerState(), tripPlannerPrompts.forest, stays, {sessionId, traceId: `${sessionId}-forest`, generationId: `${sessionId}-gen1`, startedAt: 1000});
  const second = createTripPlannerRequest(first.state, tripPlannerPrompts.beach, stays, {sessionId, traceId: `${sessionId}-beach`, generationId: `${sessionId}-gen2`, startedAt: 3000});
  return [first.record, second.record];
}

test("follow-up reveals the shared session after the first request has been inspected", () => {
  let state = reduce(reduce(initialTripLesson, {type: "next"}), {type: "next"});
  assert.equal(state.step, 1);
  assert.equal(reduce(state, {type: "next"}), state);
  assert.equal(reduce(state, {type: "field", value: "input"}), state);
  const [first, second] = requests("one");
  state = reduce(state, {type: "record", record: first});
  assert.deepEqual(state.inspected, ["first:input"]);
  state = reduce(state, {type: "field", value: "output"});
  assert.equal(reduce(state, {type: "next"}), state);
  state = reduce(state, {type: "record", record: second});
  assert.equal(state.step, 1);
  assert.equal(state.conversationVisible, true);
  assert.deepEqual(state.inspected, ["first:input", "first:output"]);
  state = reduce(state, {type: "next"});
  assert.equal(state.step, 2); // Dedicated review page.
  const failure = reduce(state, {type: "next"});
  assert.equal(failure.step, 3);
  assert.equal(reduce(failure, {type: "next"}), failure);
  assert.equal(reduce(failure, {type: "previous"}).step, 2);
  const previous = reduce(state, {type: "previous"});
  assert.equal(previous.conversationVisible, true);
  assert.deepEqual(previous.evidence, [first, second]);
  assert.deepEqual(reduce(previous, {type: "reset"}), initialTripLesson);
});

test("requests recorded before opening the lab are not counted as viewed", () => {
  const [first, second] = requests("one");
  let state = reduce(reduce(initialTripLesson, {type: "record", record: first}), {type: "record", record: second});
  assert.deepEqual(state.inspected, []);
  state = reduce(state, {type: "next"});
  assert.equal(state.captureVisible, true);
  assert.deepEqual(state.inspected, []);
  state = reduce(state, {type: "next"});
  assert.deepEqual(state.inspected, ["first:input"]);
  state = reduce(state, {type: "field", value: "output"});
  assert.equal(state.conversationVisible, false);
  assert.equal(state.field, "output");
  state = reduce(state, {type: "next"});
  assert.equal(state.conversationVisible, true);
  assert.equal(state.step, 1);
  assert.equal(reduce(state, {type: "next"}).step, 2);
});

test("lesson cannot mix requests from different conversations or replace its evidence", () => {
  const [first, second] = requests("one");
  const [otherFirst, otherSecond] = requests("two");
  let state = reduce(initialTripLesson, {type: "record", record: first});
  state = reduce(state, {type: "record", record: otherFirst});
  state = reduce(state, {type: "record", record: otherSecond});
  assert.deepEqual(state.evidence, [first]);
  state = reduce(state, {type: "record", record: second});
  state = reduce(state, {type: "record", record: otherSecond});
  assert.deepEqual(state.evidence, [first, second]);
});

test("lab entry starts with an action and withholds the raw inspector", () => {
  const html = renderToStaticMarkup(createElement(TripPlannerLabProvider, null, createElement(TripPlannerWalkthrough, {stays, onAllLabs: () => {}})));
  assert.match(html, /Start the lab/);
  assert.doesNotMatch(html, /Investigate a wrong recommendation|Request inspector|Input tokens|Inspect request|\$ai_session_id/);
});

test("an early follow-up does not skip the first request output", () => {
  const [first, second] = requests("early");
  let state = reduce(reduce(initialTripLesson, { type: "next" }), { type: "next" });
  state = reduce(state, { type: "record", record: first });
  state = reduce(state, { type: "record", record: second });
  assert.equal(state.conversationVisible, false);
  assert.equal(reduce(state, { type: "next" }), state);
  state = reduce(state, { type: "field", value: "output" });
  assert.equal(state.conversationVisible, false);
  state = reduce(state, { type: "next" });
  assert.equal(state.conversationVisible, true);
  assert.equal(state.step, 1);
});

test("queued chat prompts unlock only at their teaching stage", async () => {
  const { canSendTripLessonMessage: canSend } = await import("../dist/trip-planner-lesson.js");
  const { capacityPrompt } = await import("../dist/trip-planner-capacity.js");
  const [forest, beach] = requests("gated");
  const prompts = [...Object.values(tripPlannerPrompts), capacityPrompt];
  for (const step of [0, 2, 5]) {
    for (const prompt of prompts) assert.equal(canSend({ ...initialTripLesson, step }, prompt), false);
  }
  let state = { ...initialTripLesson, step: 1, captureVisible: false };
  assert.equal(canSend(state, tripPlannerPrompts.forest), true);
  assert.equal(canSend(state, tripPlannerPrompts.beach), false);
  state = reduce(state, { type: "record", record: forest });
  assert.equal(canSend(state, tripPlannerPrompts.forest), false);
  assert.equal(canSend(state, tripPlannerPrompts.beach), false);
  state = reduce(state, { type: "field", value: "output" });
  assert.equal(canSend(state, tripPlannerPrompts.beach), true);
  assert.equal(canSend(state, tripPlannerPrompts.kitchen), false);
  state = reduce(state, { type: "record", record: beach });
  for (const prompt of prompts) assert.equal(canSend(state, prompt), false);
  state = { ...state, step: 3 };
  assert.equal(canSend(state, tripPlannerPrompts.kitchen), true);
  assert.equal(canSend(state, capacityPrompt), true);
  assert.equal(canSend(state, tripPlannerPrompts.beach), false);
  assert.equal(canSend({ ...state, failureEvidence: [forest] }, capacityPrompt), false);
  state = { ...state, step: 4, failureEvidence: [forest] };
  assert.equal(canSend(state, capacityPrompt), false);
  state = { ...state, capacityFixed: true, investigation: "retry" };
  assert.equal(canSend(state, capacityPrompt), true);
  assert.equal(canSend({ ...state, failureEvidence: [forest, beach] }, capacityPrompt), false);
  assert.equal(canSend(reduce(state, { type: "reset" }), tripPlannerPrompts.forest), false);
});

test("a gated composer disables Send and explains how to unlock it", async () => {
  const { TripPlanner } = await import("@posthog/twig-components/trip-planner");
  const props = { stays, renderStayLink: () => null };
  const render = extra => renderToStaticMarkup(createElement(TripPlanner, { ...props, ...extra }));
  assert.match(render({ canSendMessage: () => false }), /aria-label="Send message" disabled=""/);
  assert.match(render({ canSendMessage: () => false }), /Continue in the lab to unlock this message/);
  assert.doesNotMatch(render({ canSendMessage: () => true }), /disabled=""|Continue in the lab/);
  assert.doesNotMatch(render({}), /disabled=""|Continue in the lab/);
});

test("investigation pages preserve evidence and only unlock chat on the retry page", async () => {
  const { createCapacityRequest, capacityPrompt } = await import("../dist/trip-planner-capacity.js");
  const { canSendTripLessonMessage: canSend } = await import("../dist/trip-planner-lesson.js");
  const identity = { sessionId: "review", traceId: "city-before", generationId: "gen-before", startedAt: 1000 };
  const before = createCapacityRequest(stays, identity, "capacity-broken").record;
  const after = createCapacityRequest(stays, { ...identity, traceId: "city-after", generationId: "gen-after" }, "capacity-fixed").record;
  let state = { ...initialTripLesson, step: 3, failureEvidence: [before] };
  state = reduce(state, { type: "next" });
  for (const screen of ["overview", "lookup", "fix"]) {
    assert.equal(state.step, 4);
    assert.equal(state.investigation, screen);
    assert.equal(canSend(state, capacityPrompt), false);
    if (screen !== "fix") {
      assert.equal(reduce(state, { type: "apply-capacity-fix" }), state);
      state = reduce(state, { type: "next" });
    }
  }
  assert.equal(reduce(state, { type: "next" }), state);
  state = reduce(state, { type: "apply-capacity-fix" });
  assert.equal(state.investigation, "retry");
  assert.equal(canSend(state, capacityPrompt), true);
  for (const screen of ["fix", "lookup", "overview"]) {
    state = reduce(state, { type: "previous" });
    assert.equal(state.investigation, screen);
    assert.equal(state.capacityFixed, true);
    assert.equal(canSend(state, capacityPrompt), false);
    assert.deepEqual(state.failureEvidence, [before]);
  }
  state = reduce(state, { type: "previous" });
  assert.equal(state.step, 3);
  state = reduce(reduce(reduce(state, { type: "next" }), { type: "next" }), { type: "next" });
  state = reduce(state, { type: "apply-capacity-fix" });
  state = reduce(state, { type: "record", record: after });
  assert.equal(canSend(state, capacityPrompt), false);
  state = reduce(state, { type: "next" });
  assert.equal(state.step, 4);
  assert.equal(state.investigation, "evaluation");
  assert.equal(canSend(state, capacityPrompt), false);
  assert.equal(reduce(state, { type: "apply-capacity-fix" }), state);
  const withoutRetry = { ...state, failureEvidence: [before] };
  assert.equal(reduce(withoutRetry, { type: "next" }), withoutRetry);
  state = reduce(state, { type: "previous" });
  assert.equal(state.investigation, "retry");
  assert.deepEqual(state.failureEvidence, [before, after]);
  state = reduce(reduce(state, { type: "next" }), { type: "next" });
  assert.equal(state.step, 5);
  state = reduce(state, { type: "previous" });
  assert.equal(state.investigation, "evaluation");
  assert.deepEqual(state.failureEvidence, [before, after]);
  assert.deepEqual(reduce(state, { type: "reset" }), initialTripLesson);
});


test("the capture overview comes before chat, supports back, and keeps prompts locked", async () => {
  const { canSendTripLessonMessage: canSend } = await import("../dist/trip-planner-lesson.js");
  let state = reduce(initialTripLesson, { type: "next" });
  assert.equal(state.step, 1);
  assert.equal(state.captureVisible, true);
  assert.equal(canSend(state, tripPlannerPrompts.forest), false);
  assert.equal(reduce(state, { type: "previous" }).step, 0);
  state = reduce(state, { type: "next" });
  assert.equal(state.captureVisible, false);
  assert.equal(canSend(state, tripPlannerPrompts.forest), true);
  const [forest] = requests("capture");
  state = reduce(state, { type: "record", record: forest });
  state = reduce(state, { type: "field", value: "output" });
  state = reduce(state, { type: "previous" });
  assert.equal(state.captureVisible, true);
  assert.equal(canSend(state, tripPlannerPrompts.beach), false);
  assert.deepEqual(state.evidence, [forest]);
  assert.equal(reduce(state, { type: "field", value: "input" }), state);
  state = reduce(state, { type: "next" });
  assert.equal(state.field, "output");
  assert.equal(canSend(state, tripPlannerPrompts.beach), true);
  assert.deepEqual(reduce(state, { type: "reset" }), initialTripLesson);
});

test("the capture overview preserves the recorded messages and request grouping", async () => {
  const { runInNewContext } = await import("node:vm");
  const { generationCaptureExample } = await import("../dist/trip-planner-capture-example.js");
  const [record] = requests("example-7f3a9c2e8b14");
  const p = record.properties;
  let captured;
  runInNewContext(generationCaptureExample, {
    posthog: { capture: (event, properties) => { captured = { event, properties }; } },
    sessionId: p.$ai_session_id, traceId: p.$ai_trace_id,
    messages: p.$ai_input, output: p.$ai_output_choices,
  });
  assert.deepEqual(JSON.parse(JSON.stringify(captured)), {
    event: record.event,
    properties: {
      $ai_input: p.$ai_input, $ai_output_choices: p.$ai_output_choices,
      $ai_trace_id: p.$ai_trace_id, $ai_session_id: p.$ai_session_id,
    },
  });
});
