import { calculatePlan, formatTime, safetyCopy } from "./engine.js";
import { paymentConfig } from "./payment-config.js";

const mount = document.querySelector("#paid-result");
const raw = localStorage.getItem("mvp-pending-plan");
const sessionId = new URLSearchParams(window.location.search).get("session_id");
const hasCheckoutReturn = paymentConfig.mode !== "live" || /^cs_(test_|live_)?[A-Za-z0-9]+$/.test(sessionId || "");

if (!hasCheckoutReturn) {
  mount.innerHTML = `<div class="notice"><strong>決済完了を確認できるURLではありません</strong><p>詳細プランを見るには、元の判定画面からStripeで購入してください。</p></div><a class="primary link-button" href="index.html">入力画面へ戻る</a>`;
} else if (!raw) {
  mount.innerHTML = `<div class="notice"><strong>元のプランが見つかりません</strong><p>同じブラウザで最初から条件を入力してください。</p></div><a class="primary link-button" href="index.html">入力画面へ戻る</a>`;
} else {
  try {
    const result = calculatePlan(JSON.parse(raw));
    const copy = safetyCopy[result.safety];
    localStorage.setItem("mvp-paid-access", JSON.stringify({ grantedAt: new Date().toISOString(), profileVersion: result.profileVersion, sessionId }));
    const events = JSON.parse(localStorage.getItem("mvp-events") || "[]");
    events.push({ name: "checkout_returned", properties: { venueId: result.venue.id }, at: new Date().toISOString() });
    localStorage.setItem("mvp-events", JSON.stringify(events.slice(-200)));
    mount.innerHTML = `
      <div class="detail-hero">
        <p class="kicker">${result.station.name} ${formatTime(result.departureAt)}発に乗るための参考計算</p>
        <h2><span>${formatTime(result.recommendedExitAt)}</span>までに<br />座席を離れて退出を始める</h2>
        <div class="badge-row"><span class="status tone-${copy.tone}">${copy.label}</span><span class="quality">品質 ${result.quality}</span></div>
      </div>
      <aside class="notice strong"><strong>ベータ版・実測前の参考値です</strong><p>乗車を保証するものではありません。公式案内と運行状況を必ず確認してください。</p></aside>
      <section class="timeline-card">
        <div class="timeline-head"><div><p class="eyebrow">時間の内訳</p><h3>合計 ${result.totals.conservative}分を確保</h3></div><span>保守的</span></div>
        ${result.segments.map((segment) => `<div class="segment"><div class="segment-copy"><strong>${segment.label}</strong><small>想定 ${segment.low}〜${segment.conservative}分</small></div><b>${segment.conservative}分</b></div>`).join("")}
      </section>
      <section class="check-card"><p class="eyebrow">確認事項</p><ul>${result.warnings.map((warning) => `<li>${warning}</li>`).join("")}</ul></section>
      <a class="secondary link-button" href="index.html">別の条件を計算する</a>
    `;
  } catch (error) {
    mount.innerHTML = `<div class="notice"><strong>プランを再計算できませんでした</strong><p>${error.message}</p></div><a class="primary link-button" href="index.html">入力画面へ戻る</a>`;
  }
}
