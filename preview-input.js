import { parseJapanTime } from './route-contract.js';
export function validatePreviewInput(value) {
  parseJapanTime(`${value.date}T${value.end}:00+09:00`);
  if (!['after', 'arrival', 'departure'].includes(value.mode)) throw Error('帰り方の条件を選択してください');
  const destination = String(value.destination || '').trim();
  if (!destination || destination.length > 80) throw Error('到着地を80文字以内で入力してください');
  if (value.mode !== 'after') parseJapanTime(`${value.date}T${value.time}:00+09:00`);
  if (value.mode === 'departure' && !String(value.station || '').trim()) throw Error('予約済み列車の乗車駅を入力してください');
  return destination;
}
export function sameDayCandidates(candidates) {
  // The prototype promises departures on the event date. An overnight arrival
  // is allowed, but an invented next-day departure must not silently appear.
  return candidates.filter(c => Number.isFinite(c.depart) && c.depart >= 0 && c.depart < 1440 && c.exit >= 0);
}
