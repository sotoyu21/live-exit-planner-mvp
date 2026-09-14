import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePreviewInput, sameDayCandidates } from '../preview-input.js';
const base={date:'2026-09-20',end:'20:00',mode:'after',destination:' 名古屋駅 '};
test('arrival destination is trimmed',()=>assert.equal(validatePreviewInput(base),'名古屋駅'));
test('after-event mode ignores hidden time and station',()=>assert.doesNotThrow(()=>validatePreviewInput({...base,time:'',station:''})));
test('impossible dates rejected',()=>assert.throws(()=>validatePreviewInput({...base,date:'2026-02-30'})));
test('empty destination rejected',()=>assert.throws(()=>validatePreviewInput({...base,destination:'  '})));
test('arrival mode needs valid time',()=>assert.throws(()=>validatePreviewInput({...base,mode:'arrival',time:''})));
test('booked departure requires station',()=>assert.throws(()=>validatePreviewInput({...base,mode:'departure',time:'22:00',station:'  '})));
test('past or next day departures excluded; overnight arrival allowed',()=>{
  const valid={depart:1430,exit:1380,arrival:1500};
  assert.deepEqual(sameDayCandidates([valid,{depart:1440,exit:1390},{depart:20,exit:-30},{depart:NaN,exit:0}]),[valid]);
});
