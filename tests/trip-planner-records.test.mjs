import test from "node:test";
import assert from "node:assert/strict";
import { stays } from "@posthog/twig-components/catalog";
import { createTripPlannerRequest, tripPlannerModel } from "@posthog/twig-components/trip-planner-records";
import { initialTripPlannerState, tripPlannerPrompts } from "@posthog/twig-components/trip-planner-state";

const identity = (turn, sessionId = "conversation-1") => ({ sessionId, traceId: `request-${turn}`, generationId: `generation-${turn}`, startedAt: Date.parse("2026-10-07T12:00:00Z") + turn * 10_000 });
function conversation(catalog = stays) {
  let state = initialTripPlannerState();
  return Object.values(tripPlannerPrompts).map((prompt, i) => {
    const request = createTripPlannerRequest(state, prompt, catalog, identity(i + 1));
    state = request.state;
    return request;
  });
}

test("three answers have distinct traces and generations in one session, with matching output", () => {
  const requests = conversation();
  const props = requests.map(({ record }) => record.properties);
  assert.equal(new Set(props.map((p) => p.$ai_session_id)).size, 1);
  assert.equal(new Set(props.map((p) => p.$ai_trace_id)).size, 3);
  assert.equal(new Set(props.map((p) => p.$ai_span_id)).size, 3);
  requests.forEach(({ state, record }, i) => {
    assert.equal(record.event, "$ai_generation");
    assert.equal(record.properties.$ai_output_choices[0].content, state.turns.at(-1).reply);
    assert.equal(record.properties.turn_number, i + 1);
    assert.equal(record.properties.selected_stay_id, state.selectedStayId);
    assert.equal(record.properties.group_size, 4);
    assert.equal(record.properties.$ai_is_error, false);
    assert.equal(record.properties.demo_data, true);
  });
});

test("follow-ups preserve canonical conversation history and current catalog context", () => {
  const requests = conversation();
  const [first, second, third] = requests.map(({ record }) => record.properties);
  assert.deepEqual(second.$ai_input.slice(2, 4), [first.$ai_input.at(-1), first.$ai_output_choices[0]]);
  assert.deepEqual(third.$ai_input.slice(2, 6), [first.$ai_input.at(-1), first.$ai_output_choices[0], second.$ai_input.at(-1), second.$ai_output_choices[0]]);
  assert.match(third.$ai_input[1].content, /"selectedStayId":"stay-02"/);
  assert.match(third.$ai_input[1].content, /"guests":4/);
  assert.ok(first.$ai_input_tokens < second.$ai_input_tokens);
  assert.ok(second.$ai_input_tokens < third.$ai_input_tokens);
});

test("usage prices use per-token units and costs sum without double counting history", () => {
  for (const { record } of conversation()) {
    const p = record.properties;
    assert.equal(p.$ai_model, tripPlannerModel.model);
    assert.equal(p.$ai_input_token_price, 0.000001);
    assert.equal(p.$ai_output_token_price, 0.000005);
    assert.equal(p.$ai_input_cost_usd, Number((p.$ai_input_tokens / 1_000_000).toFixed(9)));
    assert.equal(p.$ai_output_cost_usd, Number((p.$ai_output_tokens * 5 / 1_000_000).toFixed(9)));
    assert.equal(p.$ai_total_cost_usd, Number((p.$ai_input_cost_usd + p.$ai_output_cost_usd).toFixed(9)));
    assert.ok(p.$ai_total_cost_usd > 0);
    assert.ok(p.$ai_latency > 0 && p.$ai_latency < 10, "latency is in seconds, not milliseconds");
  }
});

test("arbitrary visitor text never enters the current record or later request history", () => {
  const unsupported = "My email is private@example.com";
  const first = createTripPlannerRequest(initialTripPlannerState(), unsupported, stays, identity(1));
  assert.equal(first.record.properties.scenario, "fallback");
  assert.equal(first.record.properties.$ai_is_error, false);
  const second = createTripPlannerRequest(first.state, "FIND ME A FOREST GETAWAY FOR 4!", stays, identity(2));
  for (const request of [first, second]) assert.ok(!JSON.stringify(request.record).includes(unsupported));
  assert.equal(second.record.properties.$ai_input.at(-1).content, tripPlannerPrompts.forest);
  assert.equal(second.record.properties.$ai_input[2].content, "[Unsupported message omitted]");
});

test("catalog changes affect both the visible answer and the captured request, without mutating old records", () => {
  const baseline = conversation()[1].record;
  const catalog = stays.map((stay) => stay.id === "stay-02" ? { ...stay, nightlyRate: 275 } : stay);
  const changed = conversation(catalog)[1];
  assert.match(changed.record.properties.$ai_input[1].content, /"nightlyRate":275/);
  assert.match(changed.record.properties.$ai_output_choices[0].content, /\$275 USD/);
  assert.match(baseline.properties.$ai_output_choices[0].content, /\$240 USD/);
});

test("rejected input creates no generation and a fresh session contains no old messages", () => {
  const initial = initialTripPlannerState();
  assert.equal(createTripPlannerRequest(initial, " ", stays, identity(1)), null);
  assert.equal(createTripPlannerRequest(initial, "x".repeat(241), stays, identity(1)), null);
  const reset = createTripPlannerRequest(initial, tripPlannerPrompts.forest, stays, identity(1, "conversation-2"));
  assert.equal(reset.record.properties.$ai_input.length, 3);
  assert.equal(reset.record.properties.$ai_session_id, "conversation-2");
  assert.equal(reset.record.properties.turn_number, 1);
});
