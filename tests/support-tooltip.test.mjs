import test from "node:test";
import assert from "node:assert/strict";
import { createElement as h, act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { SupportAgent } from "../dist/SupportAgent.js";

test("support reset uses the Twig tooltip on hover and focus, dismisses with Escape, and resets", async t => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>');
  const globals = { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true };
  const before = new Map(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  const root = createRoot(document.getElementById("root"));
  t.after(async () => {
    await act(() => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of before) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  let resets = 0;
  await act(() => root.render(h(SupportAgent, { guided: true, onSend() {}, onReset() { resets++; } })));
  const reset = document.querySelector('[aria-label="Reset support conversation"]');
  const wrapper = reset.parentElement;
  assert.equal(document.querySelector('[role="tooltip"]'), null);
  await act(() => wrapper.dispatchEvent(new dom.window.MouseEvent("mouseover", { bubbles: true })));
  let tooltip = document.querySelector('[role="tooltip"]');
  assert.equal(tooltip.textContent, "Reset conversation");
  assert.equal(tooltip.className, "twig-control-tooltip");
  assert.equal(reset.getAttribute("aria-describedby"), tooltip.id);
  await act(() => wrapper.dispatchEvent(new dom.window.MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body })));
  assert.equal(document.querySelector('[role="tooltip"]'), null);
  await act(() => reset.focus());
  assert.ok(document.querySelector('[role="tooltip"]'));
  await act(() => reset.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
  assert.equal(document.querySelector('[role="tooltip"]'), null);
  assert.equal(reset.getAttribute("aria-describedby"), null);
  await act(() => reset.click());
  assert.equal(resets, 1);
});
