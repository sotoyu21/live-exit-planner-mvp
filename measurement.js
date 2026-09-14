import { parseJapanTime } from './route-contract.js';
// Local analysis only. No network transmission or automatic quality promotion.
export function summarizeMeasurements(records) {
  const valid=[], excluded=[];
  for (const [index,r] of records.entries()) {
    try {
      if (!r || !r.venueId || !r.stationId || !['before_end','after_end'].includes(r.phase)) throw Error('group_missing');
      if (r.exception === true) throw Error('exception');
      const times=[r.seatLeftAt,r.venueOutAt,r.stationAt,r.platformAt].map(parseJapanTime);
      if (times.some((v,i)=>i>0 && v<times[i-1])) throw Error('time_order');
      if (!Number.isFinite(r.predictedMinutes) || r.predictedMinutes<=0) throw Error('prediction_missing');
      valid.push({key:JSON.stringify([r.venueId,r.stationId,r.phase]), actual:(times[3]-times[0])/60000,predicted:r.predictedMinutes});
    } catch (error) { excluded.push({index,reason:error.message}); }
  }
  const groups=[];
  for (const key of new Set(valid.map(r=>r.key))) {
    const rows=valid.filter(r=>r.key===key), actual=rows.map(r=>r.actual).sort((a,b)=>a-b);
    const under=rows.map(r=>Math.max(0,r.actual-r.predicted));
    const [venueId,stationId,phase]=JSON.parse(key);
    groups.push({venueId,stationId,phase,count:rows.length,medianMinutes:actual.length%2 ? actual[(actual.length-1)/2] : (actual[actual.length/2-1]+actual[actual.length/2])/2,p90Minutes:actual[Math.ceil(actual.length*.9)-1],maxMinutes:actual.at(-1),underestimatedCount:under.filter(x=>x>0).length,maxUnderestimateMinutes:Math.max(...under),quality:'unvalidated'});
  }
  return {groups,excluded,notice:'少数の記録で安全性は証明できません。ホーム到着は乗車成功ではありません。'};
}
