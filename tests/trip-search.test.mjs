import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement, useState } from 'react';

test('optional filters toggle without hiding or resetting trip selections', async t => {
  const { JSDOM } = await import('jsdom');
  const dom = new JSDOM('<!doctype html><div id="root"></div>');
  const globals = { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true };
  const previous = new Map(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  const { BrowseStays, TripSearch } = await import('../dist/BrowseStays.js');
  const { createRoot } = await import('react-dom/client');
  const { act } = await import('react');
  const root = createRoot(document.getElementById('root'));
  t.after(async () => {
    await act(() => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  const selection = { destination: 'Paris', checkIn: '2026-11-14', checkOut: '2026-11-16', guests: '2' };
  const submissions = [];
  function Example() {
    const [value, setValue] = useState(selection);
    const [expanded, setExpanded] = useState(false);
    return createElement(BrowseStays, {
      setting: 'All', search: '', onSettingChange() {}, onSearchChange() {}, renderStay() {}, results: [],
      controlsExpanded: expanded, onControlsExpandedChange: setExpanded,
      primarySearch: filters => createElement(TripSearch, { value, onChange: setValue, minDate: '2026-10-22', capacity: 5, filters, onSubmit: () => submissions.push(value) }),
    });
  }
  await act(() => root.render(createElement(Example)));
  const form = document.querySelector('.vac-trip-search');
  function checkSelections() {
    assert.equal(form.querySelector('#trip-search-destination').value, 'Paris');
    for (const id of ['trip-search-check-in', 'trip-search-check-out', 'trip-search-guests']) {
      const field = form.querySelector('#' + id);
      assert.ok(field);
      assert.equal(field.closest('[hidden]'), null);
    }
    assert.match(form.querySelector('#trip-search-guests').textContent, /2 guests/);
    assert.equal(form.querySelector('[aria-controls="trip-search-options"]'), null);
  }
  checkSelections();
  const filters = form.querySelector('.vac-browse-toggle');
  assert.equal(filters.getAttribute('aria-expanded'), 'false');
  await act(() => filters.click());
  assert.equal(filters.getAttribute('aria-expanded'), 'true');
  checkSelections();
  await act(() => filters.click());
  assert.equal(filters.getAttribute('aria-expanded'), 'false');
  checkSelections();
  await act(() => form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })));
  assert.deepEqual(submissions, [selection]);
});
