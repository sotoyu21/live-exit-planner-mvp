import { calculatePlan } from './engine.js';
export const walkingStations = Object.freeze({
  'k-arena-yokohama': ['yokohama'],
  'tokyo-dome': ['suidobashi'],
  'kyocera-dome-osaka': ['dome-mae-chiyozaki', 'taisho']
});
export function calculateManualPlan(input, now) {
  if (!walkingStations[input?.venueId]?.includes(input.stationId)) throw Error('徒歩圏の対応駅を選んでください。途中の電車移動は計算できません');
  const result = calculatePlan({...input, trainType:'local_last_train'}, now);
  result.warnings.push('入力された便の存在・運行・到着地までの乗換・終電接続は確認していません');
  return result;
}
