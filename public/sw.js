const CACHE_NAME = 'app-pwa-v1';
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icon.png',
  '/logo.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Pre-cache warning:', err);
      });
    })
  );
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
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests for static assets & HTML shell
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Bypass API routes, Next.js internal HMR/RSC, and Supabase calls
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    url.search.includes('_rsc=') ||
    url.hostname.includes('supabase.co')
  ) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && (response.type === 'basic' || response.type === 'cors')) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        if (request.headers.get('accept')?.includes('text/html')) {
          const appShell = await caches.match('/');
          if (appShell) return appShell;
        }

        return new Response('Offline', {
          status: 503,
          statusText: 'Offline',
          headers: new Headers({ 'Content-Type': 'text/plain' }),
        });
      })
  );
});
