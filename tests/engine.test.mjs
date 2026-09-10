import test from "node:test";
import assert from "node:assert/strict";
import { calculatePlan } from "../engine.js";

const base = {
  venueId: "k-arena-yokohama",
  eventDate: "2026-09-12",
  endAt: "20:00",
  crowd: "normal",
  seatZone: "middle",
  walking: "normal",
  bulkyLuggage: false,
  stationId: "yokohama",
  departureDay: "same",
  departureAt: "22:00",
  trainType: "shinkansen"
};

test("保守的な合計時間から推奨退出時刻を逆算する", () => {
  const result = calculatePlan(base, new Date("2026-09-10T12:00:00"));
  assert.equal(result.totals.conservative, 100);
  assert.equal(result.recommendedExitAt.getHours(), 20);
  assert.equal(result.recommendedExitAt.getMinutes(), 20);
  assert.equal(result.marginIfStayUntilEnd, 20);
});

test("品質Cでは余裕があっても安心判定を出さない", () => {
  const result = calculatePlan(base, new Date("2026-09-10T12:00:00"));
  assert.equal(result.safety, "insufficient_data");
  assert.equal(result.quality, "C");
});

test("混雑不明は退出と屋外時間へ追加する", () => {
  const normal = calculatePlan(base, new Date("2026-09-10T12:00:00"));
  const unknown = calculatePlan({ ...base, crowd: "unknown" }, new Date("2026-09-10T12:00:00"));
  assert.equal(unknown.totals.conservative - normal.totals.conservative, 8);
});

test("ゆっくり歩行と荷物は保守時間を増やす", () => {
  const normal = calculatePlan(base, new Date("2026-09-10T12:00:00"));
  const adjusted = calculatePlan({ ...base, walking: "slow", bulkyLuggage: true }, new Date("2026-09-10T12:00:00"));
  assert.ok(adjusted.totals.conservative > normal.totals.conservative);
});

test("翌日発の列車を日跨ぎで扱う", () => {
  const result = calculatePlan({ ...base, endAt: "23:30", departureDay: "next", departureAt: "01:30" }, new Date("2026-09-10T12:00:00"));
  assert.equal(result.departureAt.getDate(), 13);
});

test("同日で終演前の列車は拒否する", () => {
  assert.throws(
    () => calculatePlan({ ...base, endAt: "21:00", departureAt: "20:30" }, new Date("2026-09-10T12:00:00")),
    /終演予定より後/
  );
});

test("未対応の会場と駅を拒否する", () => {
  assert.throws(() => calculatePlan({ ...base, venueId: "unknown" }), /未対応の会場/);
  assert.throws(() => calculatePlan({ ...base, stationId: "unknown" }), /未対応の乗車駅/);
});

test("期限切れプロフィールは品質Cになる", () => {
  const result = calculatePlan(base, new Date("2027-04-01T12:00:00"));
  assert.equal(result.quality, "C");
  assert.ok(result.warnings.some((item) => item.includes("有効期限")));
});
