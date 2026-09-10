// A return URL or browser storage is never proof of payment.
const mount = document.querySelector('#paid-result');
try { localStorage.removeItem('mvp-paid-access'); } catch { /* Storage may be blocked. */ }
mount.innerHTML = `<section class="notice strong" role="status">
<h2>この画面では購入を確認できません</h2>
<p>現在、購入確認と詳細プランの提供機能を整備しています。URLだけで支払い済みとは判定しません。</p>
<p>すでにお支払い済みの場合は、再購入せず、領収書に記載の日時と連絡用メールアドレスを添えてお問い合わせください。カード番号などの決済情報は送らないでください。</p>
<a href="mailto:sotoyu0415@gmail.com">購入について問い合わせる</a>
</section><a class="primary link-button" href="index.html">入力画面へ戻る</a>`;
