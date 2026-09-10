// Provider-neutral boundary. Fixtures must never qualify as real timetable data.
export function parseJapanTime(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\+09:00$/.test(value)) throw Error('日時には日本時間の日付・時刻が必要です');
  const ms = Date.parse(value);
  if (!Number.isFinite(ms) || new Date(ms + 9 * 3600000).toISOString().slice(0, 19) !== value.slice(0, 19)) throw Error('存在しない日時です');
  return ms;
}
export function validateRoute(route) {
  if (!route || route.kind !== 'timetable' || !route.provider || !route.id) throw Error('実ダイヤの出典と候補IDが必要です');
  parseJapanTime(route.retrievedAt);
  if (!Array.isArray(route.legs) || !route.legs.length) throw Error('経路がありません');
  let previous;
  for (const leg of route.legs) {
    if (!['rail', 'walk', 'bus'].includes(leg.mode) || !leg.from?.id || !leg.to?.id) throw Error('未対応または不完全な移動区間です');
    const departure = parseJapanTime(leg.departureAt), arrival = parseJapanTime(leg.arrivalAt);
    if (arrival <= departure) throw Error('到着は出発より後である必要があります');
    if (previous && (previous.to.id !== leg.from.id || departure < parseJapanTime(previous.arrivalAt))) throw Error('乗換地点または時刻がつながっていません');
    if (leg.mode !== 'walk' && !leg.lineName) throw Error('路線名が必要です');
    previous = leg;
  }
  if (route.fareYen !== null && (!Number.isInteger(route.fareYen) || route.fareYen < 0)) throw Error('運賃不明はnullで扱ってください');
  return route;
}
export function evaluateAccess(route, access) {
  validateRoute(route);
  // Unknown access time cannot be silently converted to zero or "safe".
  if (!access || !Number.isFinite(access.minutes) || access.minutes <= 0 || !['A','B','C'].includes(access.quality)) return { status: 'unknown', recommendedExitAt: null };
  const end = parseJapanTime(access.eventEndAt);
  const depart = parseJapanTime(route.legs[0].departureAt);
  const exit = depart - Math.ceil(access.minutes) * 60000;
  return {
    status: access.quality === 'C' ? 'unknown' : exit < end ? 'early_exit' : 'estimated_margin',
    recommendedExitAt: new Date(exit).toISOString(),
    marginMinutes: Math.floor((exit-end)/60000),
    guarantee: false
  };
}
