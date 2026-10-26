import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectionActivityForEvent,createInspectionBus} from '../dist/experience/lib/twig-inspection.js';

test('local activity projects only allowlisted instrumentation and safe properties',()=>{
 const raw={setting:'Forest',result_count:1,prompt:'private prompt',destination:'private place',guests:4,check_in:'2027-01-01',email:'private@example.com',error:'private message'};
 assert.deepEqual(inspectionActivityForEvent('twig_stay_filter_selected',raw),{kind:'catalog',label:'Setting selected',event:'twig_stay_filter_selected',detail:'setting: Forest · result_count: 1',properties:{setting:'Forest',result_count:1},element:'<button aria-pressed="true">Forest</button>'});
 assert.equal(inspectionActivityForEvent('arbitrary_user_event',raw),null);
 assert.equal(inspectionActivityForEvent('twig_playground_inspection_selected',raw),null);
 assert.equal(inspectionActivityForEvent('twig_playground_inspector_console_cleared',raw),null);
 assert.equal(inspectionActivityForEvent('constructor',raw),null);
 assert.deepEqual(inspectionActivityForEvent('twig_demo_account_logged_in',{email:'private@example.com',name:'private name'}),{kind:'catalog',label:'Signed in',event:'twig_demo_account_logged_in',detail:'',properties:{}});
 assert.deepEqual(inspectionActivityForEvent('$exception',{message:'private message',stack:'private stack'}),{kind:'errors',label:'Site error captured',event:'$exception',detail:'',properties:{}});
 assert.equal(inspectionActivityForEvent('twig_stay_viewed',{stay_id:'private value'}).detail,'');
 assert.equal(inspectionActivityForEvent('twig_ai_search_answered',{outcome:'recommendation',result_count:1,prompt:'secret'}).kind,'discovery');
});

test('an action produces one local entry while subscribed; closing stops observation',()=>{
 const {observeInspectionActivity,publishInspectionActivity}=createInspectionBus();
 const rows=[];const stop=observeInspectionActivity(item=>rows.push(item));
 publishInspectionActivity('twig_stay_filter_selected',{setting:'Coast',result_count:1});
 publishInspectionActivity('twig_ai_search_answered',{outcome:'question',result_count:0});
 publishInspectionActivity('twig_playground_inspector_opened',{});
 assert.deepEqual(rows.map(item=>item.kind),['catalog','discovery']);
 stop();publishInspectionActivity('twig_stay_filter_selected',{setting:'City'});
 assert.equal(rows.length,2);
});
