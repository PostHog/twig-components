import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h, act } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
import { CompactAiChat, CompactRecommendedStay } from '../dist/CompactAiChat.js';
import { EvidenceTabs } from '../dist/TripPlannerEvidenceTabs.js';
import { SupportAgent } from '../dist/SupportAgent.js';
import { stays } from '../dist/catalog.js';

test('compact AI views remain fixed and do not introduce routes or model calls', () => {
  const html = renderToStaticMarkup(h(CompactAiChat, {
    messages: [{id:'reply',speaker:'assistant',content:'A forest stay for four.',recommendation:stays[0]}],
    draft:'',onSend(){},renderImage:()=>null,
  }));
  assert.match(html, /Adiron-shack/);
  assert.match(html, /Send message/);
  assert.match(html, /disabled/);
  assert.doesNotMatch(html, /href=|dialog|Collapse|Minimize/);
});

test('prepared Send and bookmark delegate to host callbacks without changing controlled state', async t => {
  const dom = new JSDOM('<div id="root"></div>');
  const globals = { window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true };
  const previous = new Map(Object.keys(globals).map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
  for(const [key,value] of Object.entries(globals))Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});
  const {createRoot}=await import('react-dom/client');const root=createRoot(document.getElementById('root'));
  t.after(async()=>{await act(()=>root.unmount());dom.window.close();for(const [key,descriptor]of previous){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}});
  const sent=[];await act(()=>root.render(h(CompactAiChat,{messages:[],draft:'Forest for four',onSend:message=>sent.push(message),renderImage:()=>null})));
  await act(()=>document.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true})));
  assert.deepEqual(sent,['Forest for four']);assert.equal(document.querySelector('textarea').readOnly,true);
  const changes=[];await act(()=>root.render(h(CompactRecommendedStay,{stay:stays[0],image:null,saved:false,onSavedChange:value=>changes.push(value)})));
  await act(()=>document.querySelector('button[aria-pressed]').click());
  assert.deepEqual(changes,[true]);assert.equal(document.querySelector('button[aria-pressed]').getAttribute('aria-pressed'),'false');
});

test('selector-only evidence tabs have no empty panel and can be disabled after review',()=>{
 const html=renderToStaticMarkup(h(EvidenceTabs,{label:'Review',value:'yes',options:[{value:'yes',label:'Yes'},{value:'no',label:'No'}],onChange(){},disabled:true}));
 assert.match(html,/role="tablist"/);assert.match(html,/disabled/);assert.doesNotMatch(html,/role="tabpanel"/);
});

test('compact recommendations retain Twig reply facts without changing default summaries', () => {
  const render = message => renderToStaticMarkup(h(CompactAiChat, { messages: [message], renderImage: () => null }));
  const message = { id: 'beach', speaker: 'assistant', content: "Flamingo's Envy looks like a fit.", recommendation: stays[1] };
  assert.match(render({ ...message, recommendationDescription: 'Room for 5. Includes beach access and full kitchen.' }), /Room for 5. Includes beach access and full kitchen/);
  assert.match(render(message), /Sleeps 5/);
});

test('typing status is present only while a reply is pending', () => {
  const props = { messages: [{ id: 'request', speaker: 'visitor', content: 'Forest for four' }], renderImage: () => null };
  assert.match(renderToStaticMarkup(h(CompactAiChat, { ...props, pending: true })), /role="status">Twig is typing…/);
  assert.doesNotMatch(renderToStaticMarkup(h(CompactAiChat, props)), /Twig is typing/);
});

test('compact support reuses the actual support composer and supports read-only pending previews', () => {
  const props = { compact: true, conversation: [{ input: 'The heating is broken.', output: '' }], pending: true };
  const html = renderToStaticMarkup(h(SupportAgent, props));
  assert.match(html, /twig-support-agent-compact/);
  assert.match(html, /How can we help with your stay/);
  assert.match(html, /role="status">Twig is typing/);
  assert.match(html, /aria-label="Customer message"[^>]*readOnly=""[^>]*disabled=""/);
  assert.doesNotMatch(html, /Reset support conversation|AI trip planner|twig-compact-chat/);
  const original = renderToStaticMarkup(h(SupportAgent, { onSend() {}, onReset() {} }));
  assert.match(original, /Reset support conversation/);
  assert.doesNotMatch(original, /twig-support-agent-compact/);
});

test('compact support sends the host-prepared draft without changing it locally', async t => {
  const dom = new JSDOM('<div id="root"></div>');
  const globals = { window:dom.window, document:dom.window.document, IS_REACT_ACT_ENVIRONMENT:true };
  const previous = new Map(Object.keys(globals).map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
  for(const [key,value] of Object.entries(globals)) Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});
  const {createRoot} = await import('react-dom/client');
  const root = createRoot(document.getElementById('root'));
  t.after(async()=>{await act(()=>root.unmount());dom.window.close();for(const [key,descriptor]of previous){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}});
  const sent=[];
  await act(()=>root.render(h(SupportAgent,{compact:true,draft:'Please refund my stay.',onSend:message=>sent.push(message)})));
  await act(()=>document.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true})));
  assert.deepEqual(sent,['Please refund my stay.']);
  assert.equal(document.querySelector('textarea').value,'Please refund my stay.');
  assert.equal(document.querySelector('textarea').readOnly,true);
});
