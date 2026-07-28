const CACHE_NAME = 'chess-lines-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Let Supabase calls go straight to network — never cache auth/API calls.
  if (request.url.includes('supabase.co')) {
    return;
  }

  // Navigation requests (HTML/app shell): always go to the network first.
  // This is the fix — the app shell must never go stale, or the browser
  // ends up asking for JS/CSS chunks that no longer exist on the server
  // after a new deploy. Falls back to the cached shell only when offline.
  const isNavigation =
    request.mode === 'navigate' ||
    (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));

  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', clone));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Hashed static assets (JS/CSS/images with content hashes in the filename)
  // are safe to serve cache-first: the filename itself changes whenever the
  // content changes, so a cache hit is always the correct, current version.
  event.respondWith(
    caches.match(request).then((cached) => {
      return (
        cached ||
        fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
      );
    })
  );
});