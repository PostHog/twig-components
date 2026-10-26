import test from 'node:test';
import assert from 'node:assert/strict';
import {initialInspectionSession,inspectionSessionReducer as reduce,selectedInspectionRecord as selected} from '../dist/InspectorSession.js';

test('Console follows new events until a record is explicitly selected',()=>{
 const first={id:1,kind:'catalog'}, second={id:2,kind:'discovery'};
 assert.equal(selected([first],initialInspectionSession),first);
 assert.equal(selected([first,second],initialInspectionSession),second);
 const pinned=reduce(initialInspectionSession,{type:'select',id:1});
 assert.equal(selected([first,second],pinned),first);
 assert.equal(selected([first,second],reduce(pinned,{type:'follow'})),second);
});

test('an earlier console event stays selected across new products',()=>{
 const records=Array.from({length:30},(_,i)=>({id:i+1,kind:'catalog'}));
 const pinned=reduce(initialInspectionSession,{type:'select',id:1});
 assert.equal(selected([...records,{id:31,kind:'discovery'}],pinned),records[0]);
});

test('Clear console removes previous records from selection and follows new activity',()=>{
 const records=Array.from({length:30},(_,i)=>({id:i+1}));
 const cleared=reduce(initialInspectionSession,{type:'clear',latestId:30});
 assert.equal(selected(records,cleared),undefined);
 assert.equal(selected(records,reduce(cleared,{type:'select',id:1})),undefined);
 const next={id:31};assert.equal(selected([...records,next],cleared),next);
});
