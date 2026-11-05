import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement as h,act} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
import {ReplayLab} from '../dist/ReplayLab.js';

for(const mode of ['ghost','manual'])test(`${mode} completion opens playback once and Previous returns to setup`,async t=>{
 const dom=new JSDOM('<div id="root"></div>');
 const globals={window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true};
 const before=new Map(Object.keys(globals).map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 for(const[k,value]of Object.entries(globals))Object.defineProperty(globalThis,k,{value,configurable:true,writable:true});
 const root=createRoot(document.getElementById('root'));
 t.after(async()=>{await act(()=>root.unmount());dom.window.close();for(const[k,v]of before){if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k];}});
 const stages=[];
 const replay={exercise:mode,recording:[],starting:false,frames:[],mode,masked:true,capturedMasked:true,message:'',setMasked(){},start(){},stop(){},clear(){},setExercise(){}};
 const props={stage:1,onStage:stage=>stages.push(stage),pathname:'/',returnHome:null,sessionPlayer:h('div',{'data-player':true},'Recording')};
 await act(()=>root.render(h(ReplayLab,{...props,replay})));
 // A stopped recorder without usable events must stay at setup.
 await act(()=>root.render(h(ReplayLab,{...props,replay:{...replay,mode:null}})));
 assert.deepEqual(stages,[]);
 await act(()=>root.render(h(ReplayLab,{...props,replay})));
 const recorded={...replay,mode:null,recording:[{},{}]};
 await act(()=>root.render(h(ReplayLab,{...props,replay:recorded})));
 assert.deepEqual(stages,[2]);
 await act(()=>root.render(h(ReplayLab,{...props,stage:2,replay:recorded})));
 assert.ok(document.querySelector('[data-player]'));
 assert.doesNotMatch(document.body.textContent,/Watch the recording/);
 await act(()=>root.render(h(ReplayLab,{...props,replay:recorded})));
 assert.deepEqual(stages,[2]);
 assert.equal(document.querySelector('[data-player]'),null);
 assert.match(document.body.textContent,mode==='ghost'?/Run ghost simulation/:/Start recording/);
});
