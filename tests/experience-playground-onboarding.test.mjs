import assert from 'node:assert/strict';
import test from 'node:test';
import { onboardingReducer as reduce } from '../dist/experience/lib/vacation/playground-onboarding.js';

test('tour builds real history before asking users to compare earlier entries', () => {
  assert.equal(reduce('idle', {type:'activity',event:'twig_stay_viewed'}), 'idle');
  let phase=reduce('idle',{type:'start'});
  assert.equal(reduce(phase,{type:'select-earlier'}),'stay');
  assert.equal(reduce(phase,{type:'activity',event:'twig_stay_filter_selected'}), 'stay');
  phase=reduce(phase,{type:'activity',event:'twig_stay_viewed'});
  assert.equal(phase,'filter');
  assert.equal(reduce(phase,{type:'activity',event:'twig_stay_viewed'}),'filter');
  phase=reduce(phase,{type:'activity',event:'twig_stay_filter_selected'});
  assert.equal(phase,'another-stay');
  assert.equal(reduce(phase,{type:'activity',event:'$ai_generation'}),'another-stay');
  phase=reduce(phase,{type:'activity',event:'twig_stay_viewed'});
  assert.equal(phase,'history');
  phase=reduce(phase,{type:'select-earlier'});
  assert.equal(phase,'compare');
  phase=reduce(phase,{type:'select-earlier'});
  assert.equal(phase,'compare-again');
  phase=reduce(phase,{type:'select-earlier'});
  assert.equal(phase,'follow');
  assert.equal(reduce(phase,{type:'activity',event:'twig_stay_viewed'}),'follow');
  phase=reduce(phase,{type:'follow'});
  assert.equal(phase,'reset');
  phase=reduce(phase,{type:'clear'});
  assert.equal(phase,'complete');
  assert.equal(reduce(phase,{type:'activity',event:'twig_stay_filter_selected'}),'complete');
  assert.equal(reduce(phase,{type:'clear'}),'complete');
});

test('resuming keeps progress; clearing restarts guidance; dismissal preserves independent inspection', () => {
  for (const phase of ['stay','filter','another-stay','history','compare','compare-again','follow']) {
    assert.equal(reduce(phase,{type:'start'}),phase);
    assert.equal(reduce(phase,{type:'dismiss'}),'idle');
    assert.equal(reduce(phase,{type:'clear'}),'stay');
  }
  assert.equal(reduce('complete',{type:'start'}),'stay');
  assert.equal(reduce('idle',{type:'clear'}),'idle');
});

test('console controls cannot advance the tour out of order', () => {
  for (const phase of ['idle','stay','filter','another-stay','history','compare','compare-again','reset','complete']) assert.equal(reduce(phase,{type:'follow'}),phase);
  for (const phase of ['idle','stay','filter','another-stay','follow','reset','complete']) assert.equal(reduce(phase,{type:'select-earlier'}),phase);
});
