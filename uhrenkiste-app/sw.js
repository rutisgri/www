// What’s the time?: Offline-Speicher. Bei jedem Update die Versionsnummer erhöhen.
const CACHE = "uhrenkiste-v4";
const ASSETS = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-512-maskable.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET") return;
  // Seite: zuerst aus dem Internet (für Updates), ohne Internet aus dem Speicher
  if(req.mode === "navigate"){
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put("index.html", copy));
      return res;
    }).catch(() => caches.match("index.html")));
    return;
  }
  // Alles andere (Symbole, Schrift): zuerst aus dem Speicher
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if(res && (res.ok || res.type === "opaque")){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
