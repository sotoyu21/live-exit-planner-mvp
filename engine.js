import { boardingBuffers, exitProfiles, venues } from "./data.js";

const MINUTE = 60_000;

function localDateTime(date, time, nextDay = false) {
  const value = new Date(`${date}T${time}:00`);
  if (Number.isNaN(value.getTime())) throw new Error("日時を正しく入力してください");
  if (nextDay) value.setDate(value.getDate() + 1);
  return value;
}

function addMinutes(profile, amount) {
  return {
    low: profile.low + amount,
    typical: profile.typical + amount,
    conservative: profile.conservative + amount
  };
}

function multiply(profile, factor) {
  return {
    low: Math.ceil(profile.low * factor),
    typical: Math.ceil(profile.typical * factor),
    conservative: Math.ceil(profile.conservative * factor)
  };
}

export function formatTime(value) {
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(value);
}

export function calculatePlan(input, now = new Date()) {
  const venue = venues.find((item) => item.id === input.venueId);
  if (!venue) throw new Error("未対応の会場です");
  const station = venue.stationProfiles.find((item) => item.id === input.stationId);
  if (!station) throw new Error("この会場では未対応の乗車駅です");
  const exitBase = exitProfiles[venue.id]?.[input.seatZone];
  if (!exitBase) throw new Error("席の位置を選択してください");
  if (!boardingBuffers[input.trainType]) throw new Error("列車種別を選択してください");

  const endAt = localDateTime(input.eventDate, input.endAt, false);
  const departureAt = localDateTime(
    input.eventDate,
    input.departureAt,
    input.departureDay === "next"
  );
  if (departureAt <= endAt && input.departureDay !== "next") {
    throw new Error("発車時刻は終演予定より後に設定してください");
  }
  if (departureAt.getTime() - endAt.getTime() > 8 * 60 * MINUTE) {
    throw new Error("MVPでは終演後8時間以内の列車だけ判定できます");
  }
  const profileExpiry = new Date(`${venue.expiresAt}T23:59:59`);
  const expired = now > profileExpiry;

  let exit = { ...exitBase };
  let outdoor = { ...station.outdoorMinutes };
  let stationTime = { ...station.stationMinutes };
  const warnings = [];

  if (input.crowd === "near_capacity" || input.crowd === "unknown") {
    exit = addMinutes(exit, input.crowd === "unknown" ? 4 : 6);
    outdoor = addMinutes(outdoor, input.crowd === "unknown" ? 4 : 6);
    warnings.push("混雑条件が大きく振れる可能性を追加しています");
  }
  if (input.walking === "slow") {
    outdoor = multiply(outdoor, 1.25);
    stationTime = multiply(stationTime, 1.2);
  } else if (input.walking === "fast") {
    warnings.push("安全側にするため、速めの歩行による時間短縮は計算に入れていません");
  }
  if (input.bulkyLuggage) {
    outdoor = addMinutes(outdoor, 3);
    stationTime = addMinutes(stationTime, 3);
  }

  const boarding = boardingBuffers[input.trainType];
  const totals = {
    low: exit.low + outdoor.low + stationTime.low + boarding,
    typical: exit.typical + outdoor.typical + stationTime.typical + boarding,
    conservative: exit.conservative + outdoor.conservative + stationTime.conservative + boarding
  };
  const recommendedExitAt = new Date(departureAt.getTime() - totals.conservative * MINUTE);
  const margin = Math.floor((recommendedExitAt.getTime() - endAt.getTime()) / MINUTE);
  let safety;
  if (expired || station.quality === "C") safety = "insufficient_data";
  else if (margin >= 20 && station.quality === "A") safety = "ample";
  else if (margin >= 0) safety = "caution";
  else if (margin >= -20) safety = "tight";
  else safety = "difficult";

  if (expired) warnings.push("会場データの有効期限が切れています");
  if (station.quality === "C") warnings.push("実測前の試験値のため、安心判定は表示していません");
  warnings.push("列車時刻・運行状況・当日の公式退場案内を別途確認してください");

  return {
    venue,
    station,
    input,
    endAt,
    departureAt,
    recommendedExitAt,
    marginIfStayUntilEnd: margin,
    safety,
    quality: expired ? "C" : station.quality,
    totals,
    segments: [
      { key: "exit", label: "座席から会場出口", ...exit },
      { key: "outdoor", label: "会場出口から乗車駅", ...outdoor },
      { key: "station", label: "駅入口から乗車位置", ...stationTime },
      { key: "boarding", label: "乗車バッファ", low: boarding, typical: boarding, conservative: boarding }
    ],
    warnings,
    profileVersion: venue.profileVersion,
    calculatedAt: now.toISOString()
  };
}

export const safetyCopy = {
  ample: { label: "十分な余裕", tone: "green", description: "保守的な想定でも余裕が残ります。" },
  caution: { label: "注意", tone: "amber", description: "混雑の振れで影響を受けます。" },
  tight: { label: "かなりタイト", tone: "orange", description: "終演まで見ると乗り遅れる可能性が高まります。" },
  difficult: { label: "厳しい", tone: "red", description: "指定列車との両立は難しい条件です。" },
  insufficient_data: { label: "判定材料不足", tone: "slate", description: "参考時刻は計算できますが、安心判定に必要な実測が不足しています。" }
};
