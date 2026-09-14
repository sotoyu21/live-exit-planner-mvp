import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateManualPlan } from '../manual-plan.js';
const input={venueId:'k-arena-yokohama',stationId:'yokohama',eventDate:'2026-09-20',endAt:'20:00',departureAt:'22:00',departureDay:'same',crowd:'unknown',walking:'normal',seatZone:'unknown',bulkyLuggage:false,timetableConfirmed:true};
test('walking station manual plan stays unvalidated',()=>assert.equal(calculateManualPlan(input).safety,'insufficient_data'));
test('confirmation checkbox is not required',()=>assert.doesNotThrow(()=>calculateManualPlan({...input,timetableConfirmed:undefined})));
test('rail transfer destinations rejected even when injected',()=>{
 for(const [venueId,stationId] of [['k-arena-yokohama','shin-yokohama'],['tokyo-dome','tokyo'],['kyocera-dome-osaka','shin-osaka']]) assert.throws(()=>calculateManualPlan({...input,venueId,stationId}));
});
