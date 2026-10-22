import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h, act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
import { PlaygroundGeneration, PlaygroundTraceExplorer, PlaygroundEvaluation } from '@posthog/twig-components/ai-evidence';
import { PlaygroundStatus } from '@posthog/twig-components/status';

test('captured chat tabs identify message roles and work with keyboard navigation', async t => {
  const dom = new JSDOM('<div id="root"></div>');
  const globals = { window:dom.window, document:dom.window.document, IS_REACT_ACT_ENVIRONMENT:true };
  const previous = new Map(Object.keys(globals).map(key => [key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  for (const [key,value] of Object.entries(globals)) Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});
  const root = createRoot(document.getElementById('root'));
  t.after(async () => {await act(()=>root.unmount());dom.window.close();for(const [key,descriptor]of previous)if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];});
  await act(()=>root.render(h(PlaygroundGeneration, {input:[{role:'user',content:'Find me a city stay for four.'}],output:[{role:'assistant',content:'No matching stays.'}],facts:[{label:'Model',value:'Claude Haiku 4.5'}],details:h('code',{},'trace-1')})));
  const tabs=[...document.querySelectorAll('[role="tab"]')];
  const panel=document.querySelector('[role="tabpanel"]');
  assert.match(panel.textContent,/User messageFind me a city stay for four/);
  tabs[0].focus();
  await act(()=>tabs[0].dispatchEvent(new window.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true})));
  assert.equal(document.activeElement,tabs[1]);
  assert.equal(tabs[1].getAttribute('aria-selected'),'true');
  assert.match(panel.textContent,/AI responseNo matching stays/);
  assert.equal(document.querySelector('.vac-ai-evidence-details').open,false);
  assert.equal(document.querySelector('td code'),null,'Readable model names are interface text');
});

test('trace disclosures represent nested operations while leaf rows have no expand control',()=>{
  const document=new JSDOM(renderToStaticMarkup(h(PlaygroundTraceExplorer,{traces:[{id:'one',title:'City stay for four',toolCall:'Search stays',generation:'Recommend a city stay'}]}))).window.document;
  assert.equal(document.querySelectorAll('summary').length,2);
  assert.equal(document.querySelectorAll('.vac-ai-operation summary').length,0);
  assert.match(document.body.textContent,/Trace · City stay for fourTool call · Search staysGeneration · Recommend a city stay/);
});

test('evaluations keep the actual observed outcome once and statuses remain readable without color',()=>{
  for(const value of ['ready','running','failed','passed','not-applicable']) assert.ok(renderToStaticMarkup(h(PlaygroundStatus,{value})).includes(`data-status="${value}"`));
  const document=new JSDOM(renderToStaticMarkup(h(PlaygroundEvaluation,{status:'passed',expected:'4+ guests or no match',observed:'No stay recommended'}))).window.document;
  assert.equal(document.querySelectorAll('tbody tr').length,1);
  assert.equal(document.body.textContent.match(/No stay recommended/g).length,1);
  assert.match(document.body.textContent,/Evaluation: Guest capacity✓ PassedExpectedObserved/);
});
