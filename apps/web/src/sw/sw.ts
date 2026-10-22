import { isHashedAsset, pageKey, typeMatches } from './rules';

/**
 * The offline worker. Rules (plan, section 12, after SaralCare's 10 June 2026 incident):
 * - pages are fetched network-first, so a new deploy is always seen when online;
 *   a server error or no connection gets the saved copy, or the offline page;
 * - only content-hashed build files are cached forever, and a cached copy is
 *   used only if its content type fits the file (never HTML for a script);
 * - a new version waits until the learner accepts the "update ready" prompt.
 * Installing saves the key pages and the build files only, so the worker is
 * ready in seconds and one failed page cannot stop it; the other pages are saved
 * afterwards, when a page asks ("fill"), each on its own.
 * Build files are kept for this version and the one before: each deploy serves
 * only its own files, and a tab still on the old version may yet load a chunk.
 * The build prepends `self.__PRECACHE__`; see src/integrations/service-worker.ts.
 */

declare const self: ServiceWorkerGlobalScope & {
  __PRECACHE__: { version: string; pages: string[]; rest: string[]; assets: string[] };
};

const { version, pages, rest, assets } = self.__PRECACHE__;
const PAGES = `pages-${version}`;
const ASSETS = `assets-${version}`;
const OFFLINE = '/offline/';
// Earlier workers kept every version's build files in one cache, named `assets`.
const isAssetCache = (name: string) => name === 'assets' || name.startsWith('assets-');

// Bypass the HTTP cache, so precaching never stores a stale copy.
const fresh = (path: string) => new Request(path, { cache: 'reload' });

/** Saves a page or file, failing if the server has no good copy of it. */
async function save(cache: Cache, path: string) {
  const response = await fetch(fresh(path));
  if (!response.ok) throw new TypeError(`precache ${path}: ${response.status}`);
  await cache.put(path, response);
}

/** A copy of a build file from any version's cache, if its type fits. */
async function savedAsset(path: string): Promise<Response | undefined> {
  const cached = (await caches.match(path, { cacheName: ASSETS })) ?? (await caches.match(path));
  return cached && typeMatches(path, cached.headers.get('content-type')) ? cached : undefined;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const [assetCache, pageCache] = await Promise.all([caches.open(ASSETS), caches.open(PAGES)]);
      await Promise.all([
        ...assets.map(async (path) => {
          // Unchanged build files are copied from the last version, not downloaded again.
          const have = await savedAsset(path);
          await (have ? assetCache.put(path, have) : save(assetCache, path));
        }),
        ...pages.map((path) => save(pageCache, path)),
      ]);
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      const oldPages = names.filter((k) => k.startsWith('pages-') && k !== PAGES);
      // Keep this version's build files and the one before (caches.keys() is in creation order).
      const oldAssets = names.filter((k) => isAssetCache(k) && k !== ASSETS).slice(0, -1);
      await Promise.all([...oldPages, ...oldAssets].map((k) => caches.delete(k)));
      // Start the page request while the worker boots, instead of after.
      await self.registration.navigationPreload?.enable();
      await self.clients.claim();
    })(),
  );
});

let filling: Promise<void> | undefined;
/** Saves the pages not saved yet, a few at a time; one that fails is tried again next time. */
function fill(): Promise<void> {
  filling ??= (async () => {
    const cache = await caches.open(PAGES);
    const have = new Set((await cache.keys()).map((r) => new URL(r.url).pathname));
    const todo = rest.filter((p) => !have.has(p));
    const worker = async () => {
      for (let path = todo.shift(); path; path = todo.shift()) await save(cache, path).catch(() => {});
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
  })().finally(() => (filling = undefined));
  return filling;
}

self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
  else if (event.data === 'fill') event.waitUntil(fill().then(() => event.ports[0]?.postMessage('filled')));
});

const saved = (key: string) => caches.match(key, { cacheName: PAGES });

async function page(event: FetchEvent): Promise<Response> {
  const { request } = event;
  const key = pageKey(request.url);
  try {
    const response = ((await event.preloadResponse) as Response | undefined) ?? (await fetch(request));
    if (response.status >= 500) return (await saved(key)) ?? response;
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
    const cached = await saved(key);
    if (cached) return cached;
    const offline = await saved(OFFLINE);
    return offline
      ? new Response(offline.body, { status: 503, headers: offline.headers })
      : new Response('You are offline.', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }
}

async function asset(request: Request, path: string): Promise<Response> {
  const cached = await savedAsset(path);
  if (cached) return cached;
  // no-cache: a missing file's 404 carries the year-long header of /_astro/*, so never trust a stored one.
  const response = await fetch(request, { cache: 'no-cache' });
  if (response.ok && typeMatches(path, response.headers.get('content-type'))) {
    await (await caches.open(ASSETS)).put(path, response.clone());
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
