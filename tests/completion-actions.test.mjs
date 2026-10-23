import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h, act, useState } from 'react';
import { JSDOM } from 'jsdom';
import { createRoot } from 'react-dom/client';
import { LessonNavigationProvider, LabNavigationView } from '../dist/LabNavigation.js';
import { LabCompletionView } from '../dist/LabCompletionView.js';

test('completion footer keeps review and choose actions together and restores Previous on exit', async t => {
  const dom = new JSDOM('<div id="root"></div>');
  const previous = new Map();
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true })) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  const root = createRoot(document.getElementById('root'));
  t.after(async () => { await act(() => root.unmount()); dom.window.close(); for (const [key, value] of previous) { if (value) Object.defineProperty(globalThis, key, value); else delete globalThis[key]; } });
  let chosen = 0;
  function Example() {
    const [complete, setComplete] = useState(true);
    return h(LessonNavigationProvider, { active: true },
      complete ? h(LabCompletionView, { lab: 'stay', headingRef: { current: null }, onChoose: () => chosen++, onReview: () => setComplete(false) }) : h('p', null, 'Retained evidence'),
      h(LabNavigationView, { selected: 'stay', stage: 3, embedded: false, placement: 'footer', onAllLabs() {}, onPrevious() {}, onReset() {} }));
  }
  await act(() => root.render(h(Example)));
  const footer = document.querySelector('.vac-lesson-footer');
  assert.deepEqual([...footer.querySelectorAll('button')].map(n => n.textContent), ['Review results', 'Choose another lab']);
  await act(() => footer.querySelector('.vac-button').click()); assert.equal(chosen, 1);
  await act(() => footer.querySelector('.vac-text-button').click());
  assert.match(document.body.textContent, /Retained evidence/);
  assert.equal(footer.textContent, '← Previous');
});
