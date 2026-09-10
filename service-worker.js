const CACHE = "live-exit-mvp-v7";
const ASSETS = ["./", "./index.html", "./privacy.html", "./commerce.html", "./success.html", "./success.js", "./styles.css", "./app.js", "./engine.js", "./data.js", "./payment-config.js", "./manifest.webmanifest", "./icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key.startsWith("live-exit-mvp-") && key !== CACHE).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || url.pathname.includes('/api/')) return;
  // Payment return pages must never be served from an old offline cache.
  if (/\/(success\.html|success\.js|payment-config\.js)$/.test(url.pathname)) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
    return;
  }
  event.respondWith(fetch(event.request, { cache: 'no-cache' }).catch(async () => {
    const cached = await caches.match(event.request);
    return cached || Response.error();
  }));
});
