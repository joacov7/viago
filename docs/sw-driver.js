const CACHE = 'nativa-driver-v2';
const STATIC = [
  './repartidor.html',
  './repartidor-app.js',
  './manifest-driver.json',
  './utils/supabaseClient.js',
  './utils/dataService.js',
  './utils/geoService.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (new URL(e.request.url).hostname.includes('supabase.co')) {
    e.respondWith(fetch(e.request).catch(() => new Response('{"data":null,"error":"offline"}', { headers: { 'Content-Type': 'application/json' } })));
    return;
  }
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
    if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
    return res;
  })));
});
