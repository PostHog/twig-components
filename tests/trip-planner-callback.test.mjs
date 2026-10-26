import test from "node:test";
import assert from "node:assert/strict";
import { createElement, act, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { TripPlannerLabProvider, TripPlannerWalkthrough, useTripPlannerLab } from "@posthog/twig-components/trip-planner-lab";
import { createTripPlannerRequest } from "@posthog/twig-components/trip-planner-records";
import { initialTripPlannerState, tripPlannerPrompts } from "@posthog/twig-components/trip-planner-state";
import { stays } from "@posthog/twig-components/catalog";
import { createCapacityRequest } from "../dist/trip-planner-capacity.js";

async function mount(t, onEvaluate) {
  const dom = new JSDOM('<!doctype html><div id="root"></div>');
  const globals = { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true };
  const previous = new Map(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  const root = createRoot(document.getElementById("root"));
  t.after(async () => {
    await act(() => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  let lab;
  function Harness() {
    lab = useTripPlannerLab();
    return createElement(TripPlannerWalkthrough, { stays, onAllLabs: () => {}, onEvaluate });
  }
  const render = () => act(() => root.render(createElement(StrictMode, null,
    createElement(TripPlannerLabProvider, null, createElement(Harness)))));
  await render();
  const click = async label => {
    const button = [...document.querySelectorAll("button")].find(button => button.textContent === label);
    assert.ok(button, `Expected button: ${label}`);
    await act(() => button.click());
  };
  const dispatch = action => act(() => lab.dispatchLesson(action));
  const record = request => act(() => lab.record(request));
  const reset = () => act(() => lab.reset());
  const identity = scenario => ({ sessionId: "callback", traceId: scenario, generationId: `${scenario}-gen`, startedAt: 1000 });
  const startCapacityCheck = async () => {
    await click("Start the lab →");
    await click("Follow the chat →");
    const forest = createTripPlannerRequest(initialTripPlannerState(), tripPlannerPrompts.forest, stays, identity("forest"));
    await record(forest.record);
    await click("Output");
    await record(createTripPlannerRequest(forest.state, tripPlannerPrompts.beach, stays, identity("beach")).record);
    await click("Review what you’ve learned →");
    // Host navigation uses the same public dispatch as the lesson controls.
    await dispatch({ type: "next" });
    await record(createCapacityRequest(stays, identity("before"), "capacity-broken").record);
    await click("Define a capacity check →");
    assert.equal(lab.lesson.investigation, "evaluate-before");
  };
  return { click, dispatch, render, startCapacityCheck, record, reset, identity, get lesson() { return lab.lesson; } };
}

test("onEvaluate fires once per phase through the public walkthrough and only on evaluation clicks", async t => {
  const phases = [];
  const view = await mount(t, phase => phases.push(phase));
  await view.startCapacityCheck();
  assert.deepEqual(phases, []);
  await view.click("Run evaluation →");
  assert.deepEqual(phases, ["before"]);
  assert.equal(view.lesson.beforeEvaluation.result, "fail");
  assert.equal(document.activeElement, document.querySelector('[role="status"]'));
  assert.equal([...document.querySelectorAll("button")].some(button => button.textContent === "Run evaluation →"), false);
  await view.render();
  await view.click("Investigate this request →");
  await view.dispatch({ type: "previous" });
  assert.match(document.querySelector('[role="status"]').textContent, /Failed/);
  assert.deepEqual(phases, ["before"]);
  await view.click("Investigate this request →");
  await view.click("Inspect the recorded search →");
  await view.click("Fix the search →");
  await view.click("Apply fix and retry →");
  await view.record(createCapacityRequest(stays, view.identity("after"), "capacity-fixed").record);
  await view.click("Evaluate the answer →");
  assert.deepEqual(phases, ["before"]);
  await view.click("Run evaluation again →");
  assert.deepEqual(phases, ["before", "after"]);
  assert.equal(view.lesson.afterEvaluation.result, "pass");
  assert.equal(document.activeElement, document.querySelector('[role="status"]'));
  await view.render();
  await view.click("Finish the lab →");
  await view.dispatch({ type: "previous" });
  assert.match(document.querySelector('[role="status"]').textContent, /Before the fix.*Failed.*After the fix.*Passed/);
  assert.equal([...document.querySelectorAll("button")].some(button => button.textContent === "Run evaluation again →"), false);
  assert.deepEqual(phases, ["before", "after"]);
  await view.reset();
  await view.startCapacityCheck();
  assert.deepEqual(phases, ["before", "after"]);
  await view.click("Run evaluation →");
  assert.deepEqual(phases, ["before", "after", "before"]);
});

test("evaluation still works when the host omits onEvaluate", async t => {
  const view = await mount(t);
  await view.startCapacityCheck();
  await view.click("Run evaluation →");
  assert.equal(view.lesson.beforeEvaluation.result, "fail");
  await view.click("Investigate this request →");
  await view.click("Inspect the recorded search →");
  await view.click("Fix the search →");
  await view.click("Apply fix and retry →");
  await view.record(createCapacityRequest(stays, view.identity("after"), "capacity-fixed").record);
  await view.click("Evaluate the answer →");
  await view.click("Run evaluation again →");
  assert.equal(view.lesson.afterEvaluation.result, "pass");
});
