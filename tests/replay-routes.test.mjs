import test from 'node:test';
import assert from 'node:assert/strict';
import {replayPage,replayPageLabel} from '../dist/replay-lab.js';

test('replay accepts a whole Twig visit and uses fixed account labels',()=>{
 for(const [path,label]of Object.entries({'/':'Find a stay','/stays/stay-01':'Stay details','/login':'Log in','/profile':'Profile','/profile/saved':'Saved stays','/profile/bookings':'Booked stays','/profile/settings':'Account settings','/about':'About Twig','/support':'Support'})){
  assert.equal(replayPage(path),true);assert.equal(replayPageLabel(path),label);
 }
 assert.equal(replayPage('/some-future-page'),true);
 assert.equal(replayPageLabel('/some-future-page'),'Twig page');
 for(const path of ['/login?next=/profile','/#secret','//example.com','https://example.com'])assert.equal(replayPage(path),false);
});
