import test from 'node:test';
import assert from 'node:assert/strict';
import {saveDraft,readDraft} from '../draft.js';
const storage=()=>{let raw=null;return {getItem:()=>raw,setItem:(k,v)=>raw=v};};
test('restore only allowed input fields',()=>{const s=storage(); saveDraft(s,{destination:'名古屋駅',secret:'no'},100); assert.deepEqual(readDraft(s,101),{destination:'名古屋駅'});});
test('expired draft is not restored',()=>{const s=storage();saveDraft(s,{venue:'x'},0);assert.equal(readDraft(s,86400001),null);});
test('blocked storage is nonfatal',()=>{assert.equal(saveDraft(undefined,{}),false);assert.equal(readDraft(undefined),null);});
test('corrupt draft ignored',()=>assert.equal(readDraft({getItem:()=>'{'}),null));
