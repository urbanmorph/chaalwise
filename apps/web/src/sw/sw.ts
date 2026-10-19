import { isHashedAsset, pageKey, typeMatches } from './rules';

/**
 * The offline worker. Rules (plan, section 12, after SaralCare's 10 June 2026 incident):
 * - pages are fetched network-first, so a new deploy is always seen when online;
 * - only content-hashed build files are cached forever, and a cached copy is
 *   used only if its content type fits the file (never HTML for a script);
 * - a new version waits until the learner accepts the "update ready" prompt.
 * The build prepends `self.__PRECACHE__`; see src/integrations/service-worker.ts.
 */

declare const self: ServiceWorkerGlobalScope & {
  __PRECACHE__: { version: string; pages: string[]; assets: string[] };
};

const { version, pages, assets } = self.__PRECACHE__;
const PAGES = `pages-${version}`;
const ASSETS = 'assets';

// Bypass the HTTP cache, so precaching never stores a stale copy.
const fresh = (path: string) => new Request(path, { cache: 'reload' });

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const assetCache = await caches.open(ASSETS);
      const have = new Set((await assetCache.keys()).map((r) => new URL(r.url).pathname));
      await assetCache.addAll(assets.filter((a) => !have.has(a)).map(fresh));
      await (await caches.open(PAGES)).addAll(pages.map(fresh));
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set(assets);
      const old = (await caches.keys()).filter((k) => k.startsWith('pages-') && k !== PAGES);
      await Promise.all(old.map((k) => caches.delete(k)));
      const assetCache = await caches.open(ASSETS);
      for (const request of await assetCache.keys()) {
        if (!keep.has(new URL(request.url).pathname)) await assetCache.delete(request);
      }
      // Start the page request while the worker boots, instead of after.
      await self.registration.navigationPreload?.enable();
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});

async function page(event: FetchEvent): Promise<Response> {
  const { request } = event;
  const key = pageKey(request.url);
  try {
    const response = ((await event.preloadResponse) as Response | undefined) ?? (await fetch(request));
    if (response.ok && response.headers.get('content-type')?.startsWith('text/html')) {
      const copy = response.clone();
      // Kept alive by the event; a full disk only means this copy is not saved.
      event.waitUntil(
        caches
          .open(PAGES)
          .then((c) => c.put(key, copy))
          .catch(() => {}),
      );
    }
    return response;
  } catch {
    const cached = await caches.match(key, { cacheName: PAGES });
    return (
      cached ??
      new Response(
        '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Offline</title><p style="font:18px/1.5 system-ui;padding:24px">You are offline, and this page is not saved on this device. <a href="/">Go to the home page</a>.</p>',
        { status: 503, headers: { 'content-type': 'text/html; charset=utf-8' } },
      )
    );
  }
}

async function asset(request: Request, path: string): Promise<Response> {
  const cache = await caches.open(ASSETS);
  const cached = await cache.match(path);
  if (cached && typeMatches(path, cached.headers.get('content-type'))) return cached;
  if (cached) await cache.delete(path);
  // no-cache: a missing file's 404 carries the year-long header of /_astro/*, so never trust a stored one.
  const response = await fetch(request, { cache: 'no-cache' });
  if (response.ok && typeMatches(path, response.headers.get('content-type'))) {
    await cache.put(path, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') event.respondWith(page(event));
  else if (isHashedAsset(url.pathname)) event.respondWith(asset(request, url.pathname));
  // Anything else goes straight to the network, uncached.
});
