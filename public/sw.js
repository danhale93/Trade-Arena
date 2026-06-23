/**
 * TRADE ARENA SERVICE WORKER
 * Progressive Web App offline support & caching
 * 
 * Version: 2.0
 * Updated: 2026-04-18
 */

const CACHE_VERSION = 'trade-arena-v3';
const CRITICAL_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// ═══════════════════════════════════════════════════════════
// INSTALL EVENT - Cache critical assets
// ═══════════════════════════════════════════════════════════
self.addEventListener('install', event => {
  console.log('🔧 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      console.log('📦 Caching critical assets');
      return cache.addAll(CRITICAL_ASSETS).catch(err => {
        console.warn('⚠️ Cache addAll partial failure:', err);
        // Don't fail on partial cache misses
      });
    })
  );
  self.skipWaiting();
});

// ═══════════════════════════════════════════════════════════
// ACTIVATE EVENT - Clean old caches
// ═══════════════════════════════════════════════════════════
self.addEventListener('activate', event => {
  console.log('✅ Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_VERSION)
          .map(name => {
            console.log('🧹 Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// ═══════════════════════════════════════════════════════════
// FETCH EVENT - Network first, fallback to cache
// ═══════════════════════════════════════════════════════════
self.addEventListener('fetch', event => {
  // Network first strategy - try to fetch, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_VERSION).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed - try cache
        return caches.match(event.request)
          .then(response => response || createOfflineFallback(event.request));
      })
  );
});

// ═══════════════════════════════════════════════════════════
// OFFLINE FALLBACK
// ═══════════════════════════════════════════════════════════
function createOfflineFallback(request) {
  // For HTML documents, return cached index.html
  if (request.destination === 'document') {
    return caches.match('./index.html');
  }
  
  // For CSS, return a minimal fallback
  if (request.destination === 'style') {
    return new Response('body { color: #fff; }', {
      headers: { 'Content-Type': 'text/css' }
    });
  }
  
  // For everything else, return 404
  return new Response('Offline - Resource not available', {
    status: 404,
    statusText: 'Not Found'
  });
}

// ═══════════════════════════════════════════════════════════
// MESSAGE HANDLER - For communication with app
// ═══════════════════════════════════════════════════════════
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_VERSION);
  }
});

console.log('🚀 Trade Arena Service Worker loaded - PWA ready!');


