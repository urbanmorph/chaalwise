/**
 * Registers the offline worker. A new version is never forced on the learner:
 * when one is waiting, an "update ready" prompt offers a reload, and only the
 * tab where they accept it reloads. Other open tabs keep their lesson and say
 * the update happened elsewhere.
 */
import { BEACON_TOKEN, LIVE_HOST } from '../lib/analytics';
import { isChunkLoadError, shouldReload } from '../lib/stale-chunk';

document.documentElement.dataset.build = __BUILD_ID__;

// A tab open across a deploy whose code is gone from the server reloads once, to the new version.
const RELOADED_AT = 'chaalwise-chunk-reload';
function reloadForNewVersion() {
  try {
    const now = Date.now();
    const last = Number(sessionStorage.getItem(RELOADED_AT)) || undefined;
    const controlled = !!navigator.serviceWorker?.controller;
    if (!shouldReload({ now, last, online: navigator.onLine, controlled })) return;
    sessionStorage.setItem(RELOADED_AT, String(now));
  } catch {
    return; // Storage is blocked: with no way to stop a loop, stay put.
  }
  location.reload();
}
window.addEventListener('vite:preloadError', reloadForNewVersion);
// An island whose code fails to load, after Astro's own retry.
window.addEventListener('astro:hydration-error', (event) => {
  if (isChunkLoadError((event as CustomEvent<{ error: unknown }>).detail.error)) reloadForNewVersion();
});
// The lessons' own lazy imports.
window.addEventListener('unhandledrejection', (event) => {
  if (isChunkLoadError(event.reason)) reloadForNewVersion();
});

// Cloudflare Web Analytics, on the live site only: no cookies, and nothing about learners.
if (location.host === LIVE_HOST) {
  const beacon = document.createElement('script');
  beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  beacon.dataset.cfBeacon = `{"token":"${BEACON_TOKEN}"}`;
  document.body.append(beacon);
}

if ('serviceWorker' in navigator && __TOMBSTONE__) {
  // Never register here: the tombstone reloads the tab after removing itself, and
  // registering again would install it again, in a loop. Only hurry the update along.
  navigator.serviceWorker
    .getRegistration()
    .then((reg) => reg?.update())
    .catch(() => {});
} else if ('serviceWorker' in navigator) {
  const banner = document.getElementById('update');
  const message = banner?.querySelector('span');
  let controller = navigator.serviceWorker.controller;
  let waiting: ServiceWorker | undefined;
  let accepted = false;

  const show = (text: string) => {
    if (!banner || !message) return;
    message.textContent = text;
    banner.hidden = false;
  };

  banner?.querySelector('button')?.addEventListener('click', () => {
    if (waiting) {
      accepted = true;
      waiting.postMessage('skip-waiting');
    } else location.reload();
  });

  const offer = (worker: ServiceWorker) => {
    if (!navigator.serviceWorker.controller) return;
    waiting = worker;
    show('A new version of Chaalwise is ready.');
  };

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    const previous = controller;
    controller = navigator.serviceWorker.controller;
    if (accepted) location.reload();
    // The first install takes control quietly; an update accepted in another tab is announced.
    else if (previous) {
      waiting = undefined;
      show('Chaalwise was updated in another tab. Reload this page to use the new version.');
    }
  });

  navigator.serviceWorker
    .register('/sw.js', { updateViaCache: 'none' })
    .then((reg) => {
      if (reg.waiting) offer(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed') offer(worker);
        });
      });
    })
    .catch((error) => console.warn('Offline mode is unavailable:', error));

  // The worker installs with the key pages only; this has it save the rest, in the background.
  void navigator.serviceWorker.ready.then((reg) => reg.active?.postMessage('fill'));
}
