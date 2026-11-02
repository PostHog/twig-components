import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement as h} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import Inspector,{InspectorCode,InspectorStatus} from '../dist/PocketGuideInspector.js';

test('pocket guide inspector renders the website Elements and Event data hierarchy with captured metadata',()=>{
 const html=renderToStaticMarkup(h(Inspector,null,h(InspectorCode,{label:'Clicked element',value:'<button aria-pressed="true">Coast</button>'}),h(InspectorCode,{label:'Event payload',meta:'2 events captured',value:JSON.stringify({event:'stay_filter_selected',timestamp:'2026-10-26T10:00:00.000Z',properties:{destination_type:'Coast'}})})));
 for(const value of ['aria-label="Inspector"','Elements','Event data','selected node','capture payload','timestamp','2 events captured','destination_type','Coast'])assert.ok(html.includes(value),value);
 assert.doesNotMatch(html,/vac-instrumentation-inspector/);
 assert.match(html,/<details open=""/);
 assert.doesNotMatch(html,/<button aria-pressed="true">Coast<\/button>/);
});
test('empty inspector uses the same status surface without inventing captured events',()=>{
 const html=renderToStaticMarkup(h(Inspector,null,h(InspectorStatus,null,'Choose a destination on Twig to inspect its event.')));
 assert.match(html,/ph-pocket-inspector-status/);
 assert.doesNotMatch(html,/capture payload|events captured/);
});

// The whitespace before the attribute must not overlap with its name (CodeQL #8).
test('element evidence handles long whitespace and malformed input safely',()=>{
 const render=value=>renderToStaticMarkup(h(InspectorCode,{label:'Clicked element',value}));
 const valid=render('<button'+ ' '.repeat(100000) +'aria-pressed="true">Coast</button>');
 assert.match(valid,/ph-pocket-inspector-tag/);
 assert.match(valid,/aria-pressed/);
 for(const value of ['<a '+ ' '.repeat(100000),'<button bad name="true">Coast</button>','<script>alert(1)</script>','<SCRIPT>alert(1)</SCRIPT>']) {
  const html=render(value);
  assert.doesNotMatch(html,/ph-pocket-inspector-tag/);
  assert.ok(!html.includes(value),'raw markup must remain escaped');
  assert.ok(html.includes('&lt;'));
 }
});
