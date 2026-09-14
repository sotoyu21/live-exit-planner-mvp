import { dataSources, venues } from "./data.js";
import { calculatePlan, formatTime, safetyCopy } from "./engine.js";
import { paymentConfig } from "./payment-config.js";
import { calculateManualPlan, walkingStations } from './manual-plan.js';
import { googleTransitUrl } from './external-route.js';
import { draftFields, saveDraft, readDraft } from './draft.js';

const state = { screen: 1, result: null };
const $ = (selector) => document.querySelector(selector);
const assignedTestPrice = Number(localStorage.getItem("mvp-price")) || [100, 200, 300][Math.floor(Math.random() * 3)];
const price = paymentConfig.mode === "live" ? paymentConfig.livePrice : assignedTestPrice;
localStorage.setItem("mvp-price", String(price));

function track(name, properties = {}) {
  const events = JSON.parse(localStorage.getItem("mvp-events") || "[]");
  events.push({ name, properties, at: new Date().toISOString() });
  localStorage.setItem("mvp-events", JSON.stringify(events.slice(-200)));
}

function downloadValidationData() {
  const payload = {
    exportedAt: new Date().toISOString(),
    appVersion: "0.2.0",
    events: JSON.parse(localStorage.getItem("mvp-events") || "[]"),
    outcomes: JSON.parse(localStorage.getItem("mvp-outcomes") || "[]")
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `live-exit-validation-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function showScreen(number) {
  state.screen = number;
  document.querySelectorAll("[data-screen]").forEach((panel) => {
    panel.classList.toggle("active", Number(panel.dataset.screen) === number);
  });
  document.querySelectorAll("[data-step-dot]").forEach((step) => {
    const current = Number(step.dataset.stepDot);
    step.classList.toggle("active", current === number);
    step.classList.toggle("done", current < number);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function populateVenues() {
  $("#venue").innerHTML = venues.map((venue) => `<option value="${venue.id}">${venue.name}</option>`).join("");
  const today = new Date();
  $("#event-date").value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  populateStations();
}

function populateStations() {
  const venue = venues.find((item) => item.id === $("#venue").value) || venues[0];
  $("#station").innerHTML = venue.stationProfiles.filter(station => walkingStations[venue.id].includes(station.id)).map((station) => `<option value="${station.id}">${station.name}</option>`).join("");
}

function collectInput() {
  return {
    venueId: $("#venue").value,
    eventDate: $("#event-date").value,
    endAt: $("#end-at").value,
    crowd: $("#crowd").value,
    seatZone: $("#seat-zone").value,
    walking: $("#walking").value,
    bulkyLuggage: $("#luggage").value === "true",
    stationId: $("#station").value,
    departureDay: $("#departure-day").value,
    departureAt: $("#departure-at").value,
    trainType: 'local_last_train'
  };
}

function marginText(margin) {
  if (margin >= 0) return `終演予定まで観た場合も、保守的計算で ${margin}分の余裕`;
  return `終演予定まで観ると、保守的計算では ${Math.abs(margin)}分不足`;
}

function renderFree(result) {
  const copy = safetyCopy[result.safety];
  $("#free-result").innerHTML = `
    <div class="result-hero tone-${copy.tone}">
      <p class="kicker">無料の簡易判定</p>
      <div class="result-title-row">
        <h2>${copy.label}</h2><span class="quality">品質 ${result.quality}</span>
      </div>
      <p>${copy.description}</p>
    </div>
    <div class="route-summary">
      <span>${result.venue.name}</span><b>→</b><span>${result.station.name} ${formatTime(result.departureAt)}発</span>
    </div>
    <article class="summary-card">
      <p class="eyebrow">保守的な余裕</p>
      <h3>${result.safety === 'insufficient_data' ? '実測不足のため、間に合うかは判定できません' : marginText(result.marginIfStayUntilEnd)}</h3>
      <p>移動時間の試験範囲: ${result.totals.low}〜${result.totals.conservative}分</p>
    </article>
    <article class="paywall-card">
      <div>
        <p class="eyebrow">詳細プラン</p>
        <h3>何時に席を離れるか、内訳まで確認</h3>
        <ul><li>推奨退出開始時刻</li><li>会場・屋外・駅構内の時間</li><li>不確実性と確認事項</li></ul>
      </div>
      <button class="purchase" id="unlock">無料で試験計算の内訳を見る</button>
    </article>
    <p class="fine-print">列車時刻と運行状況は乗換案内で確認してください。この検証版は乗車を保証しません。</p>
  `;
  $("#unlock").addEventListener("click", () => {
    if (paymentConfig.mode === "disabled") { renderDetail(result); showScreen(4); return; }
    track("detail_unlock_clicked", { price, venueId: result.venue.id, safety: result.safety, mode: paymentConfig.mode });
    localStorage.setItem("mvp-pending-plan", JSON.stringify(result.input));
    if (paymentConfig.mode === "live") {
      $("#unlock-dialog").querySelector(".kicker").textContent = "PAID BETA";
      $("#unlock-dialog").querySelector("h2").textContent = `詳細プラン ¥${price}`;
      $("#unlock-dialog").querySelector(".dialog-body > p:not(.kicker)").textContent = "次にStripeの決済ページへ移動します。現在の結果は実測前の参考値で、乗車を保証しません。";
      $("#confirm-unlock").textContent = `Stripeで支払う ¥${price}`;
    }
    $("#unlock-dialog").showModal();
  });
  track("result_viewed", { venueId: result.venue.id, safety: result.safety, quality: result.quality });
  track("detail_offer_viewed", { price, venueId: result.venue.id, safety: result.safety });
}

function renderDetail(result) {
  const copy = safetyCopy[result.safety];
  const sources = dataSources.filter((source) => source.venueId === result.venue.id);
  $("#detail-result").innerHTML = `
    <div class="detail-hero">
      <p class="kicker">${result.station.name} ${formatTime(result.departureAt)}発に乗るための参考計算</p>
      <h2><span>${formatTime(result.recommendedExitAt)}</span>までに<br />座席を離れて退出を始める</h2>
      <div class="badge-row"><span class="status tone-${copy.tone}">${copy.label}</span><span class="quality">データ品質 ${result.quality}</span></div>
    </div>
    <aside class="notice strong">
      <strong>現在は実測前の試験値です</strong>
      <p>この時刻を「間に合う保証」として使わないでください。実測を集めるための参考計算です。</p>
    </aside>
    <section class="timeline-card">
      <div class="timeline-head"><div><p class="eyebrow">時間の内訳</p><h3>合計 ${result.totals.conservative}分を確保</h3></div><span>保守的</span></div>
      ${result.segments.map((segment) => `
        <div class="segment">
          <div class="segment-copy"><strong>${segment.label}</strong><small>想定 ${segment.low}〜${segment.conservative}分</small></div>
          <b>${segment.conservative}分</b>
        </div>`).join("")}
    </section>
    <section class="check-card">
      <p class="eyebrow">出発前に確認</p>
      <ul>${result.warnings.map((warning) => `<li>${warning}</li>`).join("")}</ul>
    </section>
    <details class="source-card">
      <summary>根拠とデータ情報</summary>
      <p>${result.venue.note}</p>
      <p>プロファイル: ${result.profileVersion}</p>
      <ul>${sources.map((source) => `<li><a href="${source.url}" target="_blank" rel="noreferrer">${source.claim}</a></li>`).join("")}</ul>
    </details>
    <details class="source-card outcome-card">
      <summary>公演後の実績を記録する</summary>
      <p>個人を特定する情報は入力しません。あなた自身の判断で行動した結果を、試験値の改善に使います。</p>
      <form id="outcome-form" class="form-grid compact-form">
        <div class="two-column">
          <label><span>座席を離れた時刻</span><input id="actual-seat-left" type="time" required /></label>
          <label><span>会場外に出た時刻</span><input id="actual-venue-out" type="time" required /></label>
        </div>
        <div class="two-column">
          <label><span>乗車駅に着いた時刻</span><input id="actual-station" type="time" required /></label>
          <label><span>指定列車に乗れた</span><select id="actual-boarded"><option value="yes">はい</option><option value="no">いいえ</option><option value="changed">別の列車に変更</option></select></label>
        </div>
        <button class="primary" type="submit">匿名でこの端末に記録 <span>＋</span></button>
        <p class="success" id="outcome-success" aria-live="polite"></p>
      </form>
    </details>
    <button class="secondary wide" id="save-plan">このプランを端末に保存</button>
    <button class="text-button wide" id="export-data">検証データをファイルに出力</button>
    <p class="fine-print">保存内容はこの端末内だけに保存されます。</p>
  `;
  $("#save-plan").addEventListener("click", () => {
    localStorage.setItem("mvp-saved-plan", JSON.stringify({ input: result.input, result }));
    track("plan_saved", { venueId: result.venue.id, safety: result.safety });
    $("#save-plan").textContent = "保存しました";
    $("#save-plan").disabled = true;
  });
  $("#outcome-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const outcomes = JSON.parse(localStorage.getItem("mvp-outcomes") || "[]");
    const outcome = {
      submittedAt: new Date().toISOString(),
      venueId: result.venue.id,
      stationId: result.station.id,
      profileVersion: result.profileVersion,
      predictedExitAt: formatTime(result.recommendedExitAt),
      safety: result.safety,
      quality: result.quality,
      actualSeatLeft: $("#actual-seat-left").value,
      actualVenueOut: $("#actual-venue-out").value,
      actualStation: $("#actual-station").value,
      boarded: $("#actual-boarded").value
    };
    outcomes.push(outcome);
    localStorage.setItem("mvp-outcomes", JSON.stringify(outcomes));
    track("outcome_submitted", { venueId: result.venue.id, stationId: result.station.id, boarded: outcome.boarded });
    $("#outcome-success").textContent = "この端末に記録しました。下のボタンから検証データを出力できます。";
  });
  $("#export-data").addEventListener("click", downloadValidationData);
}

$("#venue").addEventListener("change", populateStations);
$("#event-form").addEventListener("submit", (event) => { event.preventDefault(); showScreen(2); });
$("#travel-form").addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    $("#form-error").textContent = "";
    state.result = calculateManualPlan(collectInput());
    renderFree(state.result);
    showScreen(3);
  } catch (error) {
    $("#form-error").textContent = error.message;
  }
});
document.querySelectorAll("[data-back]").forEach((button) => button.addEventListener("click", () => showScreen(Number(button.dataset.back))));
$("#cancel-unlock").addEventListener("click", () => $("#unlock-dialog").close());
$("#confirm-unlock").addEventListener("click", () => {
  if (paymentConfig.mode === "disabled") return;
  if (paymentConfig.mode === "live") {
    if (!paymentConfig.paymentUrl) {
      $("#unlock-dialog").querySelector(".dialog-body > p:not(.kicker)").textContent = "決済リンクは準備中です。公開前に設定してください。";
      return;
    }
    track("checkout_started", { price, venueId: state.result.venue.id });
    window.location.assign(paymentConfig.paymentUrl);
    return;
  }
  $("#unlock-dialog").close();
  track("detail_unlocked", { price, venueId: state.result.venue.id });
  renderDetail(state.result);
  showScreen(4);
});

populateVenues();

let draftStorage;
try { draftStorage=window.sessionStorage; } catch { /* Draft is optional. */ }
const draft=readDraft(draftStorage);
if(draft) {
  for(const id of draftFields) {
    const field=$(`#${id}`), value=draft[id];
    if(value === undefined || !field) continue;
    if(field.tagName === 'SELECT' && ![...field.options].some(o=>o.value===value)) continue;
    field.value=value;
    if(id==='venue') populateStations();
  }
}
function keepDraft() {
  saveDraft(draftStorage,Object.fromEntries(draftFields.map(id=>[id,$(`#${id}`).value])));
}
for(const id of draftFields) $(`#${id}`).addEventListener('input',keepDraft);

$('#external-route').addEventListener('click', (event) => {
  try {
    const venue = venues.find(v => v.id === $('#venue').value);
    event.currentTarget.href = googleTransitUrl(`${venue.name} ${venue.city} 日本`, $('#destination').value);
    keepDraft();
    $('#external-error').textContent = '';
  } catch (error) { event.preventDefault(); $('#external-error').textContent = error.message; $('#destination').focus(); }
});
