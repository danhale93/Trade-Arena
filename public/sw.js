// PWA Service Worker - v3 (Cache-Disabled for Update)
self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys.map(key => caches.delete(key)));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Network only - no caching
  return;
});
