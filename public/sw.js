/* Potomac Analyst Workbench - Minimal Service Worker
 * Purpose: Make the app installable as a PWA (required by iOS Safari
 * "Add to Home Screen" for standalone mode) and provide a basic
 * offline shell. We intentionally do NOT cache API responses or
 * authenticated routes — the app is data/API heavy and stale caches
 * would mislead users.
 */

const CACHE_VERSION = 'potomac-v1';
const STATIC_ASSETS = [
  '/',
  '/potomac-icon.png',
  '/fulllogo.png',
  '/blacklogo.png',
  '/site.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.addAll(STATIC_ASSETS).catch(() => {
        /* ignore individual failures so install still succeeds */
      })
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never intercept API calls, auth, or non-same-origin requests
  if (url.origin !== self.location.origin) return;
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/data/') ||
    url.pathname.startsWith('/_next/webpack-hmr')
  ) {
    return;
  }

  // Cache-first for static assets (images, icons, manifest)
  if (
    /\.(?:png|jpg|jpeg|svg|webp|ico|webmanifest|woff2?)$/i.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(request, copy).catch(() => {});
            });
            return response;
          }).catch(() => cached)
      )
    );
    return;
  }

  // Network-first for everything else, fall back to cache shell
  event.respondWith(
    fetch(request).catch(() => caches.match(request).then((c) => c || caches.match('/')))
  );
});
