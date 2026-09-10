import test from "node:test";
import assert from "node:assert/strict";
import { calculatePlan } from "../engine.js";

const common = {
  eventDate: "2026-09-12",
  departureDay: "same",
  crowd: "normal",
  seatZone: "middle",
  walking: "normal",
  bulkyLuggage: false,
  trainType: "shinkansen"
};

const cases = [
  { name: "Kアリーナ→横浜、余裕あり", input: { venueId: "k-arena-yokohama", stationId: "yokohama", endAt: "20:00", departureAt: "22:00" }, total: 100, margin: 20 },
  { name: "Kアリーナ→新横浜、終演まで見ると不足", input: { venueId: "k-arena-yokohama", stationId: "shin-yokohama", endAt: "21:00", departureAt: "22:30", crowd: "unknown" }, total: 127, margin: -37 },
  { name: "Kアリーナ→横浜、ゆっくり・荷物・満員", input: { venueId: "k-arena-yokohama", stationId: "yokohama", endAt: "20:00", departureAt: "22:30", crowd: "near_capacity", walking: "slow", bulkyLuggage: true }, total: 134, margin: 16 },
  { name: "東京ドーム→水道橋", input: { venueId: "tokyo-dome", stationId: "suidobashi", endAt: "21:00", departureAt: "22:15", crowd: "unknown", seatZone: "unknown" }, total: 91, margin: -16 },
  { name: "東京ドーム→東京駅", input: { venueId: "tokyo-dome", stationId: "tokyo", endAt: "21:00", departureAt: "22:30" }, total: 107, margin: -17 },
  { name: "東京ドーム→東京駅、後方上層", input: { venueId: "tokyo-dome", stationId: "tokyo", endAt: "20:30", departureAt: "22:45", seatZone: "rear_upper" }, total: 113, margin: 22 },
  { name: "京セラ→ドーム前千代崎", input: { venueId: "kyocera-dome-osaka", stationId: "dome-mae-chiyozaki", endAt: "21:00", departureAt: "22:30" }, total: 82, margin: 8 },
  { name: "京セラ→大正、混雑不明", input: { venueId: "kyocera-dome-osaka", stationId: "taisho", endAt: "21:00", departureAt: "22:45", crowd: "unknown", seatZone: "unknown" }, total: 107, margin: -2 },
  { name: "京セラ→新大阪、満員・後方上層", input: { venueId: "kyocera-dome-osaka", stationId: "shin-osaka", endAt: "21:00", departureAt: "23:15", crowd: "near_capacity", seatZone: "rear_upper" }, total: 152, margin: -17 },
  { name: "日跨ぎの終電相当", input: { venueId: "tokyo-dome", stationId: "suidobashi", endAt: "23:30", departureAt: "01:30", departureDay: "next", trainType: "local_last_train" }, total: 72, margin: 48 }
];

for (const scenario of cases) {
  test(scenario.name, () => {
    const result = calculatePlan({ ...common, ...scenario.input }, new Date("2026-09-10T12:00:00"));
    assert.equal(result.totals.conservative, scenario.total);
    assert.equal(result.marginIfStayUntilEnd, scenario.margin);
    assert.equal(result.safety, "insufficient_data");
  });
}
