/* PartKart Service Worker — v1
 * - Precache app shell
 * - Network-first for navigations (offline fallback to /offline)
 * - Cache-first for static assets (icons, images, fonts)
 * - NEVER cache /api/*
 */
const VERSION = 'partkart-v3';
const SHELL_CACHE = `${VERSION}-shell`;
const STATIC_CACHE = `${VERSION}-static`;
const OFFLINE_URL = '/offline';

const SHELL_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-512-maskable.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await cache.addAll(SHELL_ASSETS).catch(() => {});
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => !n.startsWith(VERSION))
          .map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // NEVER cache API calls
  if (url.pathname.startsWith('/api/')) return;

  // Navigations: network-first, fall back to cache/offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(SHELL_CACHE);
          cache.put(request, fresh.clone()).catch(() => {});
          return fresh;
        } catch (e) {
          const cache = await caches.open(SHELL_CACHE);
          const cached = (await cache.match(request)) || (await cache.match(url.pathname));
          if (cached) return cached;
          const offline = await cache.match(OFFLINE_URL);
          if (offline) return offline;
          return new Response('<h1>Offline</h1>', {
            headers: { 'Content-Type': 'text/html' },
            status: 503,
          });
        }
      })()
    );
    return;
  }

  // Scripts & styles: network-first (they change between builds), cache fallback for offline
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        try {
          const fresh = await fetch(request);
          if (fresh.ok) cache.put(request, fresh.clone()).catch(() => {});
          return fresh;
        } catch (e) {
          const cached = await cache.match(request);
          if (cached) return cached;
          return Response.error();
        }
      })()
    );
    return;
  }

  // Images & fonts: cache-first
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.startsWith('/icons/')
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const fresh = await fetch(request);
          if (fresh.ok) cache.put(request, fresh.clone()).catch(() => {});
          return fresh;
        } catch (e) {
          return cached || Response.error();
        }
      })()
    );
  }
});

// Web Push handler (notifications sent via registration.showNotification)
self.addEventListener('push', (event) => {
  let data = { title: 'PartKart', body: '' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag || 'partkart',
      data: { url: data.url || '/' },
      vibrate: [100, 50, 100],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    (async () => {
      const clientsArr = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clientsArr) {
        if ('focus' in client) {
          client.navigate(target).catch(() => {});
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })()
  );
});
