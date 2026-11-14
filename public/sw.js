const META_CACHE = 'event-offline-meta-v2';
const META_URL = '/__event_offline_manifest';
const SHELL = '/offline';
async function metadata() {
  const response = await (await caches.open(META_CACHE)).match(META_URL);
  return response ? response.json() : null;
}
async function prepare() {
  const shell = await fetch(SHELL, { cache: 'no-store', credentials: 'same-origin', redirect: 'error' });
  if (!shell.ok || !shell.headers.get('content-type')?.includes('text/html')) throw new Error('The offline operator page could not be saved.');
  const html = await shell.clone().text();
  const build = html.match(/<meta\s+name="event-offline-build"\s+content="([a-zA-Z0-9_-]+)"\s*\/?\s*>/)?.[1];
  if (!build || build === 'development') throw new Error('Offline access requires the published app. This development preview cannot verify offline files. Your saved records are safe.');
  const response = await fetch(`/offline-releases/${build}/assets.json`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Offline files for this app release are unavailable. Keep the connection and retry preparation. Your saved records are safe.');
  const manifest = await response.json();
  if (manifest.build !== build) throw new Error('The app release changed during preparation. Retry preparation to save the latest complete release. Your saved records are safe.');
  if (!manifest.build || !Array.isArray(manifest.assets) || !manifest.assets.length || manifest.assets.length > 5000 || !manifest.assets.some(asset=>typeof asset==='string' && asset.endsWith('.js'))) throw new Error('Invalid offline asset manifest.');
  if (manifest.assets.some(asset => typeof asset !== 'string' || !asset.startsWith('/_next/static/') || asset.includes('..'))) throw new Error('Unsafe offline asset manifest.');
  const name = `event-offline-${manifest.build}`;
  const cache = await caches.open(name);
  await cache.put(SHELL, shell);
  for (let index = 0; index < manifest.assets.length; index += 8) await Promise.all(manifest.assets.slice(index, index + 8).map(async asset => {
    if (await cache.match(asset)) return;
    const assetResponse = await fetch(asset, { cache: 'no-store' });
    if (!assetResponse.ok) throw new Error(`Required offline asset unavailable: ${asset}`);
    const mime=assetResponse.headers.get('content-type') || '';
    if (asset.endsWith('.js') && !mime.includes('javascript') || asset.endsWith('.css') && !mime.includes('text/css')) throw new Error(`Required offline asset has the wrong content type: ${asset}`);
    if (!(await assetResponse.clone().arrayBuffer()).byteLength) throw new Error(`Required offline asset is empty: ${asset}`);
    await cache.put(asset, assetResponse);
  }));
  for (const asset of manifest.assets) if (!await cache.match(asset)) throw new Error('Offline verification found a missing asset.');
  // Publishing the pointer last keeps a previous complete bundle usable after a failed update.
  await (await caches.open(META_CACHE)).put(META_URL, new Response(JSON.stringify({ cache: name, preparedAt: Date.now() }), { headers: { 'Content-Type': 'application/json' } }));
  return { ok: true, preparedAt: Date.now(), assets: manifest.assets.length };
}
self.addEventListener('install', event => { event.waitUntil(self.skipWaiting()); });
self.addEventListener('activate', event => { event.waitUntil(self.clients.claim()); });
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting());
  if (event.data?.type === 'PREPARE_OFFLINE') event.waitUntil(prepare().then(result => event.ports[0]?.postMessage(result)).catch(error => event.ports[0]?.postMessage({ ok: false, error: error.message })));
  // Only public code and the anonymous shell are cached. Private records live in per-user IndexedDB partitions.
  if (event.data?.type === 'CLEAR_PRIVATE') event.waitUntil(caches.delete('app-pwa-v1'));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith((async () => {
      const meta = await metadata();
      const cached = meta ? await (await caches.open(meta.cache)).match(request) : null;
      return cached || fetch(request);
    })());
    return;
  }
  if (request.mode !== 'navigate') return;
  event.respondWith((async () => {
    const meta = await metadata();
    const cached = meta ? await (await caches.open(meta.cache)).match(SHELL) : null;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
      const response = await fetch(request, { signal: controller.signal });
      if (response.status >= 500 && cached && /^\/(admin|lecturer|head)(\/|$)/.test(url.pathname)) return Response.redirect(new URL(SHELL, self.location.origin), 307);
      return response;
    } catch {
      if (cached) return url.pathname === SHELL ? cached : Response.redirect(new URL(SHELL, self.location.origin), 307);
      return new Response('This device has not been prepared for offline use. Reconnect, sign in, and choose Prepare offline access.', { status: 503, headers: { 'Content-Type': 'text/plain' } });
    } finally { clearTimeout(timeout); }
  })());
});
