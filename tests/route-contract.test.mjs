import test from 'node:test';
import assert from 'node:assert/strict';
import { parseJapanTime, validateRoute, evaluateAccess } from '../route-contract.js';
const fixture = () => ({ kind:'timetable', provider:'test-only', id:'fixture', retrievedAt:'2026-09-11T12:00:00+09:00', fareYen:null, legs:[{ mode:'rail', from:{id:'a'}, to:{id:'b'}, lineName:'TEST', departureAt:'2026-09-20T23:50:00+09:00', arrivalAt:'2026-09-21T00:30:00+09:00' }] });
test('Japan date is independent of browser timezone', () => assert.equal(parseJapanTime('2026-09-20T23:50:00+09:00'), Date.parse('2026-09-20T14:50:00Z')));
test('impossible dates and ambiguous timezones rejected', () => {
  for (const s of ['2026-02-30T12:00:00+09:00','2026-09-20T24:00:00+09:00','2026-09-20T12:00:00Z','bad']) assert.throws(()=>parseJapanTime(s));
});
test('overnight arrival accepted', () => assert.equal(validateRoute(fixture()).legs.length,1));
test('sample cannot be treated as timetable', () => assert.throws(()=>validateRoute({...fixture(),kind:'sample'})));
test('missing fare is unknown, not zero', () => { const r=fixture(); delete r.fareYen; assert.throws(()=>validateRoute(r)); });
test('backwards times rejected', () => { const r=fixture(); r.legs[0].arrivalAt='2026-09-20T23:00:00+09:00'; assert.throws(()=>validateRoute(r)); });
test('disconnected transfer rejected', () => { const r=fixture(); r.legs.push({...r.legs[0],from:{id:'other'},departureAt:'2026-09-21T00:40:00+09:00',arrivalAt:'2026-09-21T01:00:00+09:00'}); assert.throws(()=>validateRoute(r)); });
test('unmeasured quality never produces positive reassurance', () => {
  assert.equal(evaluateAccess(fixture(),{minutes:30,quality:'C',eventEndAt:'2026-09-20T20:00:00+09:00'}).status,'unknown');
  assert.equal(evaluateAccess(fixture(),{minutes:NaN}).recommendedExitAt,null);
});
test('slower access never recommends later exit', () => {
  const base={quality:'B',eventEndAt:'2026-09-20T23:30:00+09:00'};
  const fast=evaluateAccess(fixture(),{...base,minutes:30}); const slow=evaluateAccess(fixture(),{...base,minutes:60});
  assert.ok(Date.parse(slow.recommendedExitAt)<Date.parse(fast.recommendedExitAt)); assert.equal(slow.status,'early_exit'); assert.equal(slow.guarantee,false);
});
