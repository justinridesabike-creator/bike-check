// Offline cache: bump VERSION (and APP_VERSION in index.html) whenever app files change.
const VERSION = 'standings-v14';
const FILES = ['./', 'index.html', 'manifest.json', 'icon-180.png', 'icon-512.png',
  '../eighty/vendor/pdf.min.js', '../eighty/vendor/pdf.worker.min.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION)
    .then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  // Only delete this app's old caches, never another app's on the same site.
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('standings-') && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Network first, bypassing the HTTP cache; fall back to our cache when offline. Live timing (other origin) is not touched.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request, { cache: 'no-store' }).then(res => {
    const copy = res.clone();
    caches.open(VERSION).then(c => c.put(e.request, copy));
    return res;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
