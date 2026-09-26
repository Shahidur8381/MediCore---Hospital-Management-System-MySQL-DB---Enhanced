// MediCore Service Worker — Controlled Offline Shell & Static Caching
// Critical Rule: Never cache confidential patient medical records or /api/ responses

const CACHE_NAME = 'medicore-shell-v1';
const STATIC_ASSETS = [
  '/offline.html',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle standard HTTP/HTTPS requests
  if (!event.request.url.startsWith('http')) return;

  const url = new URL(event.request.url);

  // 1. Never intercept or cache backend API requests, WebSockets, or Next.js internals/RSC
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/socket.io') ||
    url.pathname.startsWith('/_next') ||
    url.searchParams.has('_rsc') ||
    url.hostname.includes('sslcommerz') ||
    url.port === '5000'
  ) {
    return; // Pass through to network
  }

  // 2. Navigation requests: Network first, fallback to offline.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        try {
          const cache = await caches.open(CACHE_NAME);
          const offlinePage = await cache.match('/offline.html');
          if (offlinePage) return offlinePage;
        } catch (_) {}
        return new Response('<!DOCTYPE html><html><body><h1>Offline</h1><p>You are currently offline. Please check your internet connection.</p></body></html>', {
          status: 503,
          headers: { 'Content-Type': 'text/html' }
        });
      })
    );
    return;
  }

  // 3. Static assets: Cache first with network fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => {
        return new Response('', { status: 404, statusText: 'Not Found' });
      });
    })
  );
});
