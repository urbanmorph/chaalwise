/**
 * Registers the offline worker. A new version is never forced on the learner:
 * when one is waiting, an "update ready" prompt offers a reload, and only the
 * tab where they accept it reloads. Other open tabs keep their lesson and say
 * the update happened elsewhere.
 */
document.documentElement.dataset.build = __BUILD_ID__;

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
}
