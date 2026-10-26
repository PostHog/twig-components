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
