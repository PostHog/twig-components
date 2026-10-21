import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {GetawaySearch} from '../dist/GetawaySearch.js';
import {stays} from '../dist/catalog.js';
test('AI entry is editable, empty, and does not open a window until sending',()=>{
 const html=renderToStaticMarkup(createElement(GetawaySearch,{stays,preferences:{destination:'',guests:'1',checkIn:'',checkOut:''},onPreferencesChange(){},renderStayLink(){return null;}}));
 assert.match(html,/<textarea/);assert.doesNotMatch(html,/readOnly|role="combobox"|role="dialog"|role="listbox"/);assert.match(html,/disabled=""/);assert.match(html,/>Simulated AI responses<\/p>/);
});


test('planner callbacks record one answer per send and reset the conversation separately', async t => {
 const {JSDOM}=await import('jsdom');
 const dom=new JSDOM('<!doctype html><div id="root"></div>');
 const globals={window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true};
 const previous=new Map(Object.keys(globals).map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 for(const[key,value]of Object.entries(globals)) Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});
 const {createRoot}=await import('react-dom/client');
 const {act,StrictMode}=await import('react');
 const root=createRoot(document.getElementById('root'));
 t.after(async()=>{await act(()=>root.unmount());dom.window.close();for(const[key,descriptor]of previous){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}});
 const answers=[];let resets=0;
 await act(()=>root.render(createElement(StrictMode,null,createElement(GetawaySearch,{stays,preferences:{destination:'',guests:'1',checkIn:'',checkOut:''},onPreferencesChange(){},onOutcome:reply=>answers.push(reply),onReset:()=>resets++,renderStayLink(){return null;}}))));
 async function send(text){
   const field=document.querySelector('textarea');
   await act(()=>{Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype,'value').set.call(field,text);field.dispatchEvent(new dom.window.Event('input',{bubbles:true}));});
   await act(()=>field.closest('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true})));
 }
 await send('A forest getaway');assert.equal(answers.length,1);assert.equal(resets,0);
 await send('start over');assert.equal(answers.length,1);assert.equal(resets,1);
 await send('A beach getaway');assert.equal(answers.length,2);
});
