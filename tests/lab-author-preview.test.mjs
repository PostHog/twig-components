import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { LabAuthor } from '../dist/LabAuthor.js';
import { createEmptyLabDraft, createEmptyAuthorPage, validateLabDraft } from '../dist/lab-author.js';

test('unfinished drafts can enter test mode and return without changing content', async t => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>');
  const globals = { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true, requestAnimationFrame: callback => { callback(); return 0; } };
  const previous = new Map(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  const root = createRoot(document.getElementById('root'));
  t.after(async () => {
    await act(() => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  const draft = createEmptyLabDraft();
  draft.steps.push(createEmptyAuthorPage('unfinished'));
  assert.ok(validateLabDraft(draft).length > 0);
  const changes = [], interactions = [];
  await act(() => root.render(createElement(LabAuthor, { draft, renderTwig: () => null, onChange: value => changes.push(value), onInteraction: event => interactions.push(event.action) })));
  const button = text => [...document.querySelectorAll('button')].find(node => node.textContent === text);
  assert.equal(button('Test lab').disabled, false);
  const divider = document.querySelector('[role="separator"]');
  await act(() => divider.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'End', bubbles: true })));
  assert.equal(document.querySelector('#author-main').style.getPropertyValue('--author-editor-height'), '1200px');
  await act(() => divider.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Home', bubbles: true })));
  assert.equal(document.querySelector('#author-main').style.getPropertyValue('--author-editor-height'), '240px');
  await act(() => button('Test lab').click());
  assert.ok(button('Restart preview'));
  assert.ok(button('← Back to authoring'));
  assert.deepEqual(interactions, ['preview_started']);
  await act(() => button('← Back to authoring').click());
  assert.ok(button('Test lab'));
  assert.deepEqual(changes, []);
  assert.ok(validateLabDraft(draft).length > 0);
});
