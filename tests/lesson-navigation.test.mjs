import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement as h, useState} from 'react';

test('footer owns one real action, keeps gating, and replaces it with Return to lab while away', async t => {
 const {JSDOM}=await import('jsdom');const dom=new JSDOM('<div id="root"></div>');
 const globals={window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true};const previous=new Map(Object.keys(globals).map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));for(const[k,v]of Object.entries(globals))Object.defineProperty(globalThis,k,{value:v,configurable:true,writable:true});
 const {createRoot}=await import('react-dom/client');const {act}=await import('react');const {LessonNavigationProvider,LabPrimaryAction,LabNavigationView,LessonActionScope}=await import('../dist/LabNavigation.js');const root=createRoot(document.getElementById('root'));
 t.after(async()=>{await act(()=>root.unmount());dom.window.close();for(const[k,d]of previous){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}});
 let next=0;
 function Example(){const [ready,setReady]=useState(false),[away,setAway]=useState(false);return h(LessonNavigationProvider,{active:true},h(LessonActionScope,{visible:false},h(LabPrimaryAction,null,h('button',null,'Hidden lesson action'))),h('div',{id:'body'},h('button',{onClick:()=>setReady(true)},'Complete task'),h('button',{onClick:()=>setAway(true)},'Leave page'),h(LabPrimaryAction,null,h('button',{disabled:!ready,onClick:()=>next++},'Continue'))),h(LabNavigationView,{selected:'catalog',stage:1,embedded:false,placement:'footer',onAllLabs(){},onPrevious(){},onReset(){},returnTo:away?{label:'Find a stay',onClick:()=>setAway(false)}:undefined}));}
 await act(()=>root.render(h(Example)));let button=[...document.querySelectorAll('button')].find(n=>n.textContent==='Continue');assert.equal(document.body.textContent.includes('Hidden lesson action'),false);assert.ok(button.closest('.vac-lesson-footer'));assert.equal(button.disabled,true);assert.equal(document.querySelector('#body').textContent.includes('Continue'),false);
 await act(()=>[...document.querySelectorAll('button')].find(n=>n.textContent==='Complete task').click());button=[...document.querySelectorAll('button')].find(n=>n.textContent==='Continue');assert.equal(button.disabled,false);await act(()=>button.click());assert.equal(next,1);
 await act(()=>[...document.querySelectorAll('button')].find(n=>n.textContent==='Leave page').click());assert.equal(document.querySelector('.vac-lesson-footer').textContent.includes('Continue'),false);await act(()=>[...document.querySelectorAll('button')].find(n=>n.textContent==='Return to lab').click());assert.ok([...document.querySelectorAll('button')].find(n=>n.textContent==='Continue'));
});
