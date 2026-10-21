import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement as h, act} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
import {PlaygroundMarker} from '../dist/PlaygroundPanels.js';
import {playgroundPage} from '../dist/playground.js';
import {stays} from '../dist/catalog.js';

test('marker product help is contextual, described on focus, dismissible, and preserves lesson entry', async t => {
 const dom=new JSDOM('<!doctype html><div class="vac-app"><div id="root"></div></div>');
 const globals={window:dom.window,document:dom.window.document,CustomEvent:dom.window.CustomEvent,ResizeObserver:class {observe(){} disconnect(){}},IS_REACT_ACT_ENVIRONMENT:true};
 const before=new Map(Object.keys(globals).map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 for(const [key,value] of Object.entries(globals))Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});
 const root=createRoot(document.getElementById('root'));
 t.after(async()=>{await act(()=>root.unmount());dom.window.close();for(const [key,descriptor]of before){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}});
 const chosen=[];
 const points=[...new Map([...playgroundPage('/',stays).touchpoints,...playgroundPage('/stays/stay-01',stays).touchpoints].map(point=>[point.id,point])).values()];
 for(const point of points) {
  await act(()=>root.render(h(PlaygroundMarker,{key:point.id,touchpoint:point,highlighted:false,onHighlight(){},onChoose:id=>chosen.push(id)})));
  const marker=document.querySelector('button');
  assert.equal(document.querySelector('[role="tooltip"]'),null);
  await act(()=>marker.focus());
  const tooltip=document.querySelector('[role="tooltip"]');
  assert.ok(tooltip.textContent.includes(point.tool));
  assert.match(tooltip.textContent,/Click marker to open lab/);
  assert.ok(tooltip.querySelector("code"),"Explain the actual instrumentation mechanism or event");
  assert.equal(marker.getAttribute('aria-describedby'),tooltip.id);
  assert.equal(tooltip.closest('.vac-app'),marker.closest('.vac-app'));
  await act(()=>window.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape'})));
  assert.equal(document.querySelector('[role="tooltip"]'),null);
  await act(()=>marker.click());
  assert.equal(chosen.at(-1),point.id);
 }
});
