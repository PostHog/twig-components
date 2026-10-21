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
