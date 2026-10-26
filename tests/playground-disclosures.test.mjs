import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
import { EventsLab } from '../dist/EventsLab.js';
import { initialEventsState } from '../dist/events-lab.js';
import { InstrumentationInspector } from '../dist/InstrumentationInspector.js';

const noop = () => {};
test('recorded events preserve selection semantics and time cells without disclosure icons', () => {
  const events = [1, 2].map(n => ({id:`0-3-${n}`,event:'stay_filter_selected',timestamp:`2026-10-22T12:00:0${n}Z`,properties:{destination_type:n === 1 ? 'Forest' : 'Coast'}}));
  const document = new JSDOM(renderToStaticMarkup(h(EventsLab, {state:{...initialEventsState,step:3,configured:[3],events,inspected:events[0].id},dispatch:noop,onChoose:noop}))).window.document;
  const rows = [...document.querySelectorAll('.vac-activity-list tbody tr')];
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map(row => row.querySelector('button').getAttribute('aria-pressed')), ['true', 'false']);
  assert.equal(document.querySelectorAll('.vac-activity-list .vac-disclosure-icon').length, 0);
  assert.equal(document.querySelector('.vac-activity-detail code').textContent, 'destination_type');
  assert.match(document.querySelector('.vac-activity-detail').textContent, /Coast/);
  for (const row of rows) {
    assert.equal(row.querySelector('code').textContent, 'stay_filter_selected');
    assert.ok(row.querySelector('td:nth-child(2) time[datetime]'));
  }
});

test('nested evidence keeps native independently operable disclosures with a plus/minus pair', () => {
  const document = new JSDOM(renderToStaticMarkup(h(InstrumentationInspector, {event:'stay_filter_selected', properties:{nested:{value:1}}}))).window.document;
  const summaries = [...document.querySelectorAll('summary')];
  assert.ok(summaries.length >= 2);
  for (const summary of summaries) {
    assert.equal(summary.parentElement.tagName, 'DETAILS');
    assert.ok(summary.querySelector('.vac-inspector-disclosure-label').textContent);
    assert.equal(summary.querySelectorAll('.vac-disclosure-plus').length, 1);
    assert.equal(summary.querySelectorAll('.vac-disclosure-minus').length, 1);
    assert.equal(summary.querySelector('.vac-disclosure-icon').getAttribute('aria-hidden'), 'true');
  }
});
