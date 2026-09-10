import { venues } from './data.js';
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const minute = (s) => Number(s.slice(0,2))*60+Number(s.slice(3));
const clock = (n) => `${n>=1440?'翌日 ':n<0?'前日 ':''}${String(Math.floor(((n%1440)+1440)%1440/60)).padStart(2,'0')}:${String(((n%60)+60)%60).padStart(2,'0')}`;
let candidates = [], input;
$('#venue').innerHTML = venues.map(v=>`<option value="${v.id}">${v.name}</option>`).join('');
const now=new Date(); $('#date').value=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
function stationOptions(){ $('#stations').innerHTML=venues.find(v=>v.id===$('#venue').value).stationProfiles.map(s=>`<option value="${s.name}">`).join(''); }
stationOptions(); $('#venue').onchange=stationOptions;
$('#timing').onchange=()=>{const mode=$('#timing').value; $('#time-row').hidden=mode==='after'; $('#time').required=mode!=='after'; $('#station-row').hidden=mode!=='departure'; $('#reserved-station').required=mode==='departure'; $('#time-label').textContent=mode==='arrival'?'到着したい時刻（公演当日）':'予約済み列車の発車時刻（公演当日）';};
function screen(name){for(const s of ['search','results','detail'])$(`#${s}-screen`).hidden=s!==name; window.scrollTo(0,0);}
$('#edit').onclick=()=>screen('search'); $('#back-results').onclick=()=>screen('results');
$('#route-form').onsubmit=(e)=>{e.preventDefault(); $('#error').textContent=''; const destination=$('#destination').value.trim(); if(!destination){$('#error').textContent='到着地を入力してください';return;}
input={venue:venues.find(v=>v.id===$('#venue').value),destination,end:minute($('#end').value),mode:$('#timing').value,time:minute($('#time').value),walking:$('#walking').value,seat:$('#seat').value,luggage:$('#luggage').value};
// Deliberately synthetic UI fixtures. Never treat these as a route provider.
const access=45+(input.walking==='slow'?15:0)+(input.seat==='rear_upper'?10:0)+(input.luggage==='yes'?5:0);
candidates=[{id:0,label:'サンプルA · 到着を優先',duration:90,fare:6800,transfers:1,offset:0},{id:1,label:'サンプルB · 観覧時間を優先',duration:120,fare:5200,transfers:2,offset:25},{id:2,label:'サンプルC · 費用を優先',duration:160,fare:2400,transfers:2,offset:45}].map(c=>{const depart=input.mode==='arrival'?input.time-c.duration:input.mode==='departure'?input.time:input.end+access+c.offset;return {...c,depart,arrival:depart+c.duration,exit:depart-access,access,station:input.mode==='departure'?$('#reserved-station').value:input.venue.stationProfiles[c.id%input.venue.stationProfiles.length].name};});
render(); screen('results');};
$('#sort').onchange=render;
function render(){const key=$('#sort').value;const sorted=[...candidates].sort((a,b)=>key==='price'?a.fare-b.fare:key==='arrival'?a.arrival-b.arrival:b.exit-a.exit); $('#results-title').textContent=`${input.venue.name} → ${input.destination}`;
$('#results').innerHTML=sorted.map(c=>`<article class="summary-card" style="margin-top:16px"><p class="eyebrow">架空データ · ${c.label}</p><h3>${clock(c.depart)}発 → ${clock(c.arrival)}着</h3><p>${esc(c.station)} → ${esc(input.destination)}<br>乗換${c.transfers}回 · サンプル運賃 ¥${c.fare.toLocaleString()}</p><p><strong>退出目安 ${clock(c.exit)}</strong><br>${c.exit<input.end?`終演予定の${input.end-c.exit}分前に退出する想定`:`終演予定から${c.exit-input.end}分後に退出する想定`} · 安全度は未判定</p><button class="primary wide" data-route="${c.id}">この候補の詳細を見る →</button></article>`).join('');
document.querySelectorAll('[data-route]').forEach(b=>b.onclick=()=>detail(candidates.find(c=>c.id===Number(b.dataset.route))));}
function detail(c){$('#detail').innerHTML=`<div class="detail-hero"><p class="kicker">架空の候補 · 実際の案内ではありません</p><h2>${clock(c.exit)} 退出目安</h2><p>${esc(input.destination)}に ${clock(c.arrival)}着のサンプル</p></div><section class="timeline-card"><h3>選んだ候補の流れ</h3><p>${clock(c.exit)} ${esc(input.venue.name)}の座席を離れる</p><p>↓ 会場内・駅までの移動・乗車余裕 ${c.access}分（操作用仮定）</p><p>${clock(c.depart)} ${esc(c.station)} 発</p><p>↓ サンプル路線 · 乗換${c.transfers}回<br>実接続後は路線名・乗換駅・各発着時刻を表示</p><p>${clock(c.arrival)} ${esc(input.destination)} 着</p></section><aside class="notice"><strong>条件の反映</strong><p>歩行：${input.walking==='slow'?'ゆっくり':'ふつう'}、荷物：${input.luggage==='yes'?'あり':'なし'}。この試作品の数値は実測に基づく判定ではありません。</p></aside><section class="summary-card"><h3>正式版の詳細退出プラン：200円を予定</h3><p>実ダイヤ、時間内訳、不確実性、購入後の再表示を整えてから販売します。今は無料の操作確認です。</p></section>`;screen('detail');}
