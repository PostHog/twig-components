import test from 'node:test';
import assert from 'node:assert/strict';
import {createExperienceRuntime} from '../dist/experience/Runtime.js';

test('experiences isolate inspector events and project safe callback properties', () => {
 const callbacks=[]; const first=createExperienceRuntime(event=>callbacks.push(event));
 const second=createExperienceRuntime(()=>assert.fail('Other experience received an event'));
 const a=[],b=[];
 const stopA=first.observeInspectionActivity(event=>a.push(event));
 const stopB=second.observeInspectionActivity(event=>b.push(event));
 first.trackTwigEvent('twig_stay_filter_selected',{setting:'Forest',result_count:1,prompt:'private',email:'private@example.com'});
 assert.equal(a.length,1); assert.equal(b.length,0);
 assert.deepEqual(callbacks,[{event:'twig_stay_filter_selected',properties:{setting:'Forest',result_count:1}}]);
 first.trackTwigEvent('unknown',{prompt:'private'});
 assert.equal(callbacks.length,1);
 stopA();stopB();
 first.trackTwigEvent('twig_stay_filter_selected',{setting:'City'});
 assert.equal(a.length,1);
});
