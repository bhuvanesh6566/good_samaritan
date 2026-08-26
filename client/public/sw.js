const CACHE_NAME = 'rescuelink-v1';
const urlsToCache = [
  '/',
  '/offline-first-aid',
  '/good-samaritan-shield',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
