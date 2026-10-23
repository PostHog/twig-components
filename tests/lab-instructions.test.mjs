import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
import { EventsLab } from '../dist/EventsLab.js';
import { initialEventsState, eventsReducer, currentEvents, canContinue } from '../dist/events-lab.js';

const noop = () => {};
const view = state => new JSDOM(renderToStaticMarkup(h(EventsLab, { state, dispatch: noop, onChoose: noop }))).window.document;
const rows = document => [...document.querySelectorAll('ol[aria-label="Filter activity progress"] > li')];
const click = (state, setting) => eventsReducer(state, {type:'click', setting, count:1, timestamp:'2026-10-22T12:00:00Z'});

test('the first web interaction uses the approved single-step instruction, never an Activity placeholder', () => {
  let state = eventsReducer(initialEventsState, {type:'path', path:'web'});
  let document = view(state);
  assert.equal(rows(document).length, 1);
  assert.equal(rows(document)[0].dataset.state, 'current');
  assert.equal(rows(document)[0].querySelector('.vac-check-status'), null);
  assert.match(rows(document)[0].textContent, /setting.*Filters/);
  assert.equal(document.querySelector('.vac-web-evidence'), null);
  assert.equal(document.querySelector('h3'), null);
  assert.equal(canContinue(state), false);
  state = click(state, 'Forest');
  document = view(state);
  assert.equal(rows(document)[0].dataset.state, 'done');
  assert.ok(document.querySelector('.vac-activity-list'));
  assert.equal(canContinue(state), false, 'a direction does not bypass the existing inspection gate');
});

test('configuration and two distinct filter choices share one progressive checklist in both experiences', () => {
  for (const path of ['web', 'mcp']) {
    let state = {...initialEventsState, path, step:3};
    assert.deepEqual(rows(view(state)).slice(0,3).map(n=>n.dataset.state), ['current','upcoming','upcoming']);
    state = eventsReducer(state, {type:'configure'});
    assert.deepEqual(rows(view(state)).slice(0,3).map(n=>n.dataset.state), ['done','current','upcoming']);
    state = click(state, 'Forest');
    assert.deepEqual(rows(view(state)).slice(0,3).map(n=>n.dataset.state), ['done','done','current']);
    state = click(state, 'Forest');
    assert.equal(rows(view(state))[2].dataset.state, 'current', 'a repeated setting is not a different setting');
    state = click(state, 'Coast');
    assert.deepEqual(rows(view(state)).slice(0,3).map(n=>n.dataset.state), ['done','done','done']);
    if(path === 'mcp') {
      assert.equal(rows(view(state)).at(-1).dataset.state, 'current');
      state = eventsReducer(state, {type:'inspect', id:currentEvents(state).at(-1).id});
      assert.equal(rows(view(state)).at(-1).dataset.state, 'current', 'web inspection state cannot complete an agent message that has not been sent');
    }
    assert.ok(rows(view(state)).every(n=>n.querySelector('.vac-check-status')));
  }
});
