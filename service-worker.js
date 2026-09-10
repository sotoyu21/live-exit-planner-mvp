const CACHE = "live-exit-mvp-v4";
const ASSETS = ["./", "./index.html", "./privacy.html", "./commerce.html", "./success.html", "./success.js", "./styles.css", "./app.js", "./engine.js", "./data.js", "./payment-config.js", "./manifest.webmanifest", "./icon.svg"];

self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS))));
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))));
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
