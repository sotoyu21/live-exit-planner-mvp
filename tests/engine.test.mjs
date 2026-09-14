import test from "node:test";
import assert from "node:assert/strict";
import { calculatePlan, formatTime } from "../engine.js";

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
  assert.equal(formatTime(result.recommendedExitAt), '20:20');
  assert.equal(result.recommendedExitAt.toISOString(), '2026-09-12T11:20:00.000Z');
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
  assert.equal(result.departureAt.toISOString(), '2026-09-12T16:30:00.000Z');
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

test('利用日がデータ期限を超えた場合も未検証扱い', () => {
  const result = calculatePlan({...base, eventDate:'2027-04-01'}, new Date('2026-09-14T00:00:00Z'));
  assert.ok(result.warnings.some(x=>x.includes('有効期限')));
  assert.equal(result.safety,'insufficient_data');
});
test('存在しない日付や時刻を拒否', () => {
  for (const change of [{eventDate:'2026-02-30'}, {eventDate:'bad'}, {endAt:'24:00'}, {departureAt:'25:00'}]) assert.throws(()=>calculatePlan({...base,...change}));
});
test('未知の条件を通常条件として扱わない', () => {
  for (const change of [{crowd:'oops'}, {walking:''}, {departureDay:'oops'}, {bulkyLuggage:'false'}]) assert.throws(()=>calculatePlan({...base,...change}));
});
test('終演前退出に終演後モデルを使用していることを明示', () => {
  const result=calculatePlan({...base, departureAt:'20:30'});
  assert.ok(result.warnings.some(x=>x.includes('終演前退出')));
});
