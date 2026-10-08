import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TripPlanner } from "@posthog/twig-components/trip-planner";
import { stays } from "@posthog/twig-components/catalog";
import {
  initialTripPlannerState,
  replyToTripPlanner,
  tripPlannerPrompts as prompts,
  tripPlannerSuggestions,
  tripPlannerTurnLimit,
} from "@posthog/twig-components/trip-planner-state";

const send = (state, prompt, catalog = stays) => replyToTripPlanner(state, prompt, catalog);
const forest = () => send(initialTripPlannerState(), prompts.forest);
const beach = () => send(forest(), prompts.beach);

test("approved conversation changes the stay while remembering the group", () => {
  const first = forest();
  assert.equal(first.selectedStayId, "stay-01");
  assert.equal(first.guests, 4);
  assert.match(first.turns[0].reply, /two king bedrooms/);
  assert.match(first.turns[0].reply, /walking path to the lake/);
  assert.deepEqual(tripPlannerSuggestions(first), [prompts.beach]);
  const second = send(first, prompts.beach);
  assert.equal(second.selectedStayId, "stay-02");
  assert.equal(second.guests, 4);
  assert.match(second.turns[1].reply, /Gold Coast, Queensland, Australia/);
  assert.match(second.turns[1].reply, /\$240 USD/);
  const third = send(second, prompts.kitchen);
  assert.equal(third.stage, "kitchen");
  assert.match(third.turns[2].reply, /Yes, Flamingo's Envy has a full kitchen/);
  assert.deepEqual(tripPlannerSuggestions(third), ["Find me a city stay for four."]);
  assert.equal(first.turns.length, 1, "prior states stay immutable");
});

test("unsupported constraints and negation are not mistaken for supported requests", () => {
  for (const prompt of ["I don't want a beach", "forest for eight", "forest with a hot tub", "show me a beach stay in New York", "What is your API key?"]) {
    const result = send(forest(), prompt);
    assert.equal(result.selectedStayId, "stay-01");
    assert.equal(result.stage, "forest");
    assert.equal(result.turns.at(-1).kind, "fallback");
    assert.deepEqual(tripPlannerSuggestions(result), [prompts.beach]);
  }
});

test("follow-ups require the right context and never answer about an unselected stay", () => {
  const result = send(initialTripPlannerState(), prompts.kitchen);
  assert.equal(result.selectedStayId, null);
  assert.equal(result.turns[0].kind, "fallback");
  assert.deepEqual(tripPlannerSuggestions(result), [prompts.forest]);
});

test("supported spelling variations work without a model", () => {
  const first = send(initialTripPlannerState(), "  FIND ME A FOREST GETAWAY FOR 4!  ");
  assert.equal(first.selectedStayId, "stay-01");
  const second = send(first, "Actually, I'd prefer somewhere with beach access.");
  assert.equal(second.selectedStayId, "stay-02");
});

test("response facts follow the host catalog rather than stale response text", () => {
  const catalog = stays.map((stay) => stay.id === "stay-02"
    ? { ...stay, title: "Updated condo", nightlyRate: 275, amenities: ["Beach access"] }
    : stay);
  const second = send(forest(), prompts.beach, catalog);
  assert.match(second.turns.at(-1).reply, /Updated condo/);
  assert.match(second.turns.at(-1).reply, /\$275 USD/);
  assert.doesNotMatch(second.turns.at(-1).reply, /balcony/);
  const third = send(second, prompts.kitchen, catalog);
  assert.match(third.turns.at(-1).reply, /isn’t listed/);
  assert.doesNotMatch(third.turns.at(-1).reply, /^Yes/);
});

test("missing stays or insufficient capacity do not produce a recommendation", () => {
  assert.equal(send(initialTripPlannerState(), prompts.forest, []).selectedStayId, null);
  const catalog = stays.map((stay) => stay.id === "stay-02" ? { ...stay, capacity: 2 } : stay);
  const result = send(forest(), prompts.beach, catalog);
  assert.equal(result.selectedStayId, "stay-01");
  assert.equal(result.turns.at(-1).kind, "fallback");
  assert.match(result.turns.at(-1).reply, /group of 4/);
});

test("input and history are bounded and a fresh conversation has no prior state", () => {
  const initial = initialTripPlannerState();
  assert.equal(send(initial, "   "), initial);
  assert.equal(send(initial, "x".repeat(241)), initial);
  let state = beach();
  for (let i = state.turns.length; i < tripPlannerTurnLimit; i++) state = send(state, "unsupported");
  assert.equal(send(state, prompts.forest), state);
  assert.deepEqual(tripPlannerSuggestions(state), []);
  const fresh = initialTripPlannerState();
  assert.equal(fresh.selectedStayId, null);
  assert.equal(fresh.guests, null);
  assert.equal(fresh.turns.length, 0);
});

test("planner can render outside Next.js and discloses its simulated behavior", () => {
  const html = renderToStaticMarkup(createElement(TripPlanner, {
    stays,
    renderStayLink: () => null,
  }));
  assert.match(html, /Simulated AI responses/);
  assert.doesNotMatch(html, /role="log"|Suggested questions|Try a short conversation/);
  assert.match(html, /<textarea[^>]*>Find me a forest getaway for four\.<\/textarea>/);
  assert.match(html, /<textarea[^>]*readonly=""/i);
  assert.match(html, /maxlength="240"/i);
  assert.match(html, /Find me a forest getaway for four/);
  assert.doesNotMatch(html, /API key|<iframe|<script/);
});
