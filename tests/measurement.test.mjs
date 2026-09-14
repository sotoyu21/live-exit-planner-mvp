import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeMeasurements } from '../measurement.js';
const row={venueId:'test',stationId:'test',phase:'after_end',seatLeftAt:'2026-09-20T23:40:00+09:00',venueOutAt:'2026-09-20T23:50:00+09:00',stationAt:'2026-09-21T00:10:00+09:00',platformAt:'2026-09-21T00:20:00+09:00',predictedMinutes:30};
test('overnight measurement flags underestimated time',()=>{
  const result=summarizeMeasurements([row]);
  assert.equal(result.groups[0].maxMinutes,40);
  assert.equal(result.groups[0].maxUnderestimateMinutes,10);
  assert.equal(result.groups[0].quality,'unvalidated');
});
test('missing data never becomes zero',()=>assert.equal(summarizeMeasurements([{...row,stationAt:null}]).excluded.length,1));
test('reversed timestamps excluded',()=>assert.equal(summarizeMeasurements([{...row,venueOutAt:'2026-09-20T20:00:00+09:00'}]).excluded.length,1));
test('early exit and post-event records stay separate',()=>assert.equal(summarizeMeasurements([row,{...row,phase:'before_end'}]).groups.length,2));
test('exception records excluded from ordinary estimates',()=>assert.equal(summarizeMeasurements([{...row,exception:true}]).groups.length,0));
test('empty data provides no estimated statistics',()=>assert.deepEqual(summarizeMeasurements([]).groups,[]));
