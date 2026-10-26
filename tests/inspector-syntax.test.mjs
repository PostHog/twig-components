import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import { InstrumentationInspector } from "../dist/InstrumentationInspector.js";

function inspect(element) {
  const dom = new JSDOM(renderToStaticMarkup(createElement(InstrumentationInspector, { properties: {}, element })));
  return { dom, syntax: dom.window.document.querySelector("samp") };
}

test("Inspector markup retains literal text and existing syntax classes", () => {
  const element = '<button data-replay-label="Open stay" aria-pressed="false">A & B</button>';
  const { dom, syntax } = inspect(element);
  assert.equal(syntax.textContent, element);
  assert.deepEqual([...syntax.querySelectorAll(".vac-inspector-tag")].map(el => el.textContent), ["<button", "</button"]);
  assert.deepEqual([...syntax.querySelectorAll(".vac-inspector-key")].map(el => el.textContent), ["data-replay-label", "aria-pressed"]);
  assert.deepEqual([...syntax.querySelectorAll(".vac-inspector-string")].map(el => el.textContent), ['"Open stay"', '"false"']);
  dom.window.close();
});

test("Inspector leaves malformed markup and executable-looking attributes as text", () => {
  for (const element of ['<img src=x onerror="alert(1)">', '<input data-name="unclosed -- value', '---', 'plain_name', '<custom-element key="">']) {
    const { dom, syntax } = inspect(element);
    assert.equal(syntax.textContent, element);
    assert.equal(syntax.querySelector("img, input, script, custom-element"), null);
    dom.window.close();
  }
});

test("long malformed element names finish without regex backtracking", () => {
  // Isolate the render so a regression cannot block the test worker indefinitely.
  const script = `
    import assert from 'node:assert/strict';
    import {createElement} from 'react';
    import {renderToStaticMarkup} from 'react-dom/server';
    import {InstrumentationInspector} from './dist/InstrumentationInspector.js';
    const repeated = '-'.repeat(100000);
    const html = renderToStaticMarkup(createElement(InstrumentationInspector, {
      properties: {}, element: '<button ' + repeated + '>'
    }));
    assert.ok(html.includes(repeated));
  `;
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], { cwd: process.cwd(), encoding: "utf8", timeout: 5000 });
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, 0, result.stderr);
});
