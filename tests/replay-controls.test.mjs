import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement as h,act} from 'react';
import {createRoot} from 'react-dom/client';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
import {ReplayControls,RecordingControls,replayTime} from '../dist/ReplayControls.js';
import {PlaygroundStackTrace} from '../dist/PlaygroundErrorEvidence.js';
async function mount(t,component){
 const dom=new JSDOM('<!doctype html><div id="root"></div>');
 const globals={window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true};
 const before=new Map(Object.keys(globals).map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 for(const[k,value]of Object.entries(globals))Object.defineProperty(globalThis,k,{value,configurable:true,writable:true});
 const root=createRoot(document.getElementById('root'));
 t.after(async()=>{await act(()=>root.unmount());dom.window.close();for(const[k,v]of before){if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k]}});
 await act(()=>root.render(component));return{root,dom};
}
test('transport retains seek/time geometry and exposes Play, Pause and Replay with real callbacks',async t=>{
 let toggles=0,fullscreen=0;const sought=[];const props={position:0,duration:8000,playing:false,onToggle:()=>toggles++,onSeek:value=>sought.push(value),onFullscreen:()=>fullscreen++};
 const{root}=await mount(t,h(ReplayControls,props));
 await act(()=>document.querySelector('[aria-label="Play"]').click());assert.equal(toggles,1);
 await act(()=>document.querySelector('[aria-label="Full screen"]').click());assert.equal(fullscreen,1);
 for(const[state,label]of [[{position:3200,playing:true},'Pause'],[{position:8000,playing:false},'Replay']]){
  await act(()=>root.render(h(ReplayControls,{...props,...state})));
  assert.ok(document.querySelector(`[aria-label="${label}"]`));assert.equal(document.querySelectorAll('input[type="range"]').length,1);
 }
 assert.equal(document.querySelector('.vac-replay-time').textContent,'0:08 / 0:08');
 await act(()=>root.render(h(ReplayControls,{...props,fullscreenUnavailable:true})));
 assert.equal(document.querySelector('[aria-label="Full screen"]').disabled,true);assert.equal(document.querySelector('[aria-label="Play"]').disabled,false);
 await act(()=>root.render(h(ReplayControls,{...props,disabled:true})));
 assert.ok([...document.querySelectorAll('button,input')].every(n=>n.disabled));assert.equal(document.querySelector('.vac-replay-time').textContent,'–:–– / –:––');
 await act(()=>root.render(h(ReplayControls,{...props,position:3200,duration:8173})));
 assert.equal(replayTime(125999),'2:05');
});
test('recording stop callback remains an accessible control with elapsed time',async t=>{
 let stopped=0;await mount(t,h(RecordingControls,{elapsedMs:12000,onStop:()=>stopped++}));
 assert.equal(document.querySelector('.vac-recording-time').textContent,'0:12');
 await act(()=>document.querySelector('[aria-label="Stop recording"]').click());assert.equal(stopped,1);
});
test('stack selection changes the associated source and keeps the whole frame selectable',async t=>{
 await mount(t,h(PlaygroundStackTrace));
 const frames=document.querySelectorAll('[aria-label="Stack frames"] button');assert.equal(frames[0].getAttribute('aria-pressed'),'true');
 await act(()=>frames[1].click());assert.equal(frames[1].getAttribute('aria-pressed'),'true');assert.equal(frames[0].getAttribute('aria-pressed'),'false');
 assert.equal(document.querySelector('.vac-code-header').textContent,'TypeScript');
 assert.equal(document.querySelector('.vac-source-caption').textContent,'AccountPages.tsx');assert.match(document.querySelector('pre').textContent,/readTripHost\(\{\}, stay.hostId\)/);
});
test('all recording/playback glyphs are included in the distributable CSS assets',async()=>{
 const{readFileSync,existsSync}=await import('node:fs');
 const css=readFileSync('dist/lab.css','utf8');
 for(const name of ['play','pause','restart','fullscreen']){assert.ok(existsSync(`dist/assets/replay-${name}.svg`));assert.match(css,new RegExp(`replay-${name}\\.svg`));}
 assert.match(css,/prefers-reduced-motion: reduce[^]*vac-recording-stop-ring/);
});
