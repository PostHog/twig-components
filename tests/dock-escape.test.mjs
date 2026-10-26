import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement as h,act} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
import {PlaygroundDock} from '../dist/PlaygroundPanels.js';

test('dock Escape is optional and respects nested controls that prevent default',async t=>{
 const dom=new JSDOM('<!doctype html><div id="root"></div>');
 const globals={window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true};
 const before=new Map(Object.keys(globals).map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 for(const [key,value]of Object.entries(globals))Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});
 const root=createRoot(document.getElementById('root'));
 t.after(async()=>{await act(()=>root.unmount());dom.window.close();for(const [key,descriptor]of before){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}});
 let closed=0;
 const props={embedded:false,onClose:()=>closed++,headingRef:{current:null},logo:null,navigation:null,recordingBar:null,pageKey:'one',guide:h('button',{'aria-label':'Draft'},'Draft')};
 const escape=()=>act(()=>document.querySelector('button[aria-label="Draft"]').dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})));
 await act(()=>root.render(h(PlaygroundDock,props)));
 await escape();assert.equal(closed,1,'learner default keeps Escape shortcut');
 await act(()=>root.render(h(PlaygroundDock,{...props,closeOnEscape:false})));
 await escape();assert.equal(closed,1,'authored docks stay open');
 await act(()=>root.render(h(PlaygroundDock,{...props,guide:h('button',{'aria-label':'Draft',onKeyDown:event=>event.preventDefault()},'Draft')})));
 await escape();assert.equal(closed,1,'nested controls may consume Escape');
});
