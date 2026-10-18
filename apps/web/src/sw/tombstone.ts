/**
 * The tombstone worker, ready in case caching ever goes wrong. Deploy it with
 * `SW_TOMBSTONE=1 pnpm build`: it replaces sw.js, deletes every cache, unregisters
 * itself and reloads open tabs, so learners land on the live site with no worker.
 * The same build stops pages registering a worker (see __TOMBSTONE__), or the
 * reload would install the tombstone again, in a loop.
 * Browsers always re-fetch sw.js (it is served no-cache), so this reliably takes
 * over from any worker still installed. Modelled on SaralCare's public/sw.js.
 * Learner progress is in IndexedDB, not Cache Storage, so it is untouched.
 */

declare const self: ServiceWorkerGlobalScope;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await Promise.all((await caches.keys()).map((k) => caches.delete(k)));
      await self.clients.claim();
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((client) => client.navigate(client.url));
    })(),
  );
});

// No fetch handler on purpose: every request goes straight to the network.

export {};
