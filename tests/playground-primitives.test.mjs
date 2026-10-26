import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement as h,act} from 'react';
import {createRoot} from 'react-dom/client';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
import {PlaygroundCodeBlock} from '../dist/PlaygroundCodeBlock.js';
import {CopyControl} from '../dist/PlaygroundTooltip.js';
import {WizardCommand} from '../dist/WizardCommand.js';
import {McpComposer} from '../dist/McpComposer.js';

async function mount(t,component){
 const dom=new JSDOM('<!doctype html><div id="root"></div>');
 const globals={window:dom.window,document:dom.window.document,navigator:{clipboard:{writeText:async()=>{}}},IS_REACT_ACT_ENVIRONMENT:true};
 const before=new Map(Object.keys(globals).map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 for(const[k,value]of Object.entries(globals))Object.defineProperty(globalThis,k,{value,configurable:true,writable:true});
 const root=createRoot(document.getElementById('root'));
 t.after(async()=>{await act(()=>root.unmount());dom.window.close();for(const[k,v]of before){if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k]}});
 await act(()=>root.render(component));return{root,dom};
}

test('code highlighting preserves exact multiline code and joins highlighted lines',()=>{
 const value='posthog.capture(\n  "event",\n  { count: 1 }\n);';
 const dom=new JSDOM(renderToStaticMarkup(h(PlaygroundCodeBlock,{code:value,highlightLines:[2,3]})));
 const pre=dom.window.document.querySelector('pre');assert.equal(pre.textContent,value);
 assert.deepEqual([...pre.querySelectorAll('[data-highlighted="true"]')].map(n=>n.textContent),['  "event",','  { count: 1 }']);
 assert.equal(dom.window.document.querySelector('.vac-code-header').textContent,'JavaScript');dom.window.close();
});

test('copy feedback expires without changing the code or replacing its copy icon',async t=>{
 const value='const stay = "Forest";';let copied;
 await mount(t,h(CopyControl,{text:value}));navigator.clipboard.writeText=async value=>{copied=value};
 await act(async()=>{document.querySelector('button').click();await Promise.resolve()});assert.equal(copied,value);assert.equal(document.querySelector('[role="tooltip"]').textContent,'Copied!');
 assert.ok(document.querySelector('.vac-copy-glyph'));
 await act(()=>new Promise(resolve=>setTimeout(resolve,550)));assert.equal(document.querySelector('[role="tooltip"]'),null);assert.equal(document.querySelector('[role="status"]'),null);
 navigator.clipboard.writeText=async()=>{throw Error('denied')};await act(async()=>{document.querySelector('button').click();await Promise.resolve()});assert.equal(document.querySelector('[role="tooltip"]'),null);
 assert.equal(document.querySelector('button').getAttribute('aria-label'),'Copy code');
});

test('Wizard commands keep the source display and clipboard contract separate',async t=>{
 let copied;await mount(t,h(WizardCommand,{command:'mcp add'}));navigator.clipboard.writeText=async value=>{copied=value};
 assert.equal(document.querySelector('code').textContent,'npx @posthog/wizard mcp add');await act(async()=>{document.querySelector('button').click();await Promise.resolve()});assert.equal(copied,'npx -y @posthog/wizard@latest mcp add');assert.match(document.querySelector('a').href,/posthog.com\/wizard/);
});

test('MCP composer submits its draft, disables an empty message and exposes a working stop control',async t=>{
 const sent=[];let stopped=0;const{root,dom}=await mount(t,h(McpComposer,{suggested:'Inspect the latest event.',onSend:m=>sent.push(m)}));
 await act(async()=>{document.querySelector('button').click();await Promise.resolve()});assert.deepEqual(sent,['Inspect the latest event.']);
 assert.equal(document.querySelector('textarea').value,'');assert.equal(document.querySelector('button').disabled,true);
 assert.equal(document.querySelector('button').textContent,'↑');
 await act(()=>root.render(h(McpComposer,{suggested:'Inspect the latest event.',pending:true,onSend:m=>sent.push(m),onStop:()=>stopped++})));
 assert.equal(document.querySelector('textarea').disabled,true);await act(async()=>{document.querySelector('button').click();await Promise.resolve()});assert.equal(stopped,1);
});
