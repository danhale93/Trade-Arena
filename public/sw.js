// PWA Service Worker - v2 with cache busting
const CACHE_VERSION = 'v2-' + Date.now();
const STATIC_CACHE = 'static-' + CACHE_VERSION;
const DYNAMIC_CACHE = 'dynamic-' + CACHE_VERSION;

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/arena-react-bundle.js',
  '/trading-engine.js',
  '/advanced-bot-engine.js',
  '/ai-arena.js',
  '/multi-ai-arena.js',
  '/elo-tournament-engine.js',
  '/task-center.js',
  '/marketplaces.js'
];

self.addEventListener('install', e => {
  console.log('[SW] Installing service worker v2...');
  e.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      console.log('[SW] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.log('[SW] Pre-cache failed, will fetch dynamically:', err);
      });
    }).then(() => {
      console.log('[SW] Skip waiting to activate immediately');
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', e => {
  console.log('[SW] Activating service worker v2, clearing old caches...');
  e.waitUntil(
    caches.keys().then(keys => {
      console.log('[SW] Found caches:', keys);
      return Promise.all(
        keys.map(key => {
          if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Claiming all clients');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external requests
  if (url.origin !== location.origin) return;

  // For HTML pages, always fetch fresh (prevent stale UI)
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(request)
        .then(response => {
          // Cache the fresh response
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // For static assets with versioned names, try cache first then network
  if (url.pathname.includes('arena-react-bundle') || 
      url.pathname.includes('.js') || 
      url.pathname.includes('.css')) {
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, responseClone));
          return response;
        });
      })
    );
    return;
  }

  // Default: network first, cache fallback
  e.respondWith(
    fetch(request)
      .then(response => {
        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, responseClone));
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Handle messages from main thread (to force refresh)
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') {
    self.skipWaiting();
  }
  if (e.data === 'clearCache') {
    caches.keys().then(keys => {
      return Promise.all(keys.map(key => caches.delete(key)));
    }).then(() => {
      self.clients.matchAll().then(clients => {
        clients.forEach(client => client.navigate(client.url));
      });
    });
  }
});

console.log('[SW] Service Worker v2 loaded with cache busting');
