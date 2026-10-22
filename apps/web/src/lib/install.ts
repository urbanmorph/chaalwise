/**
 * The "Install app" button.
 *
 * - Chrome, Edge, Samsung Internet and Android fire `beforeinstallprompt`; we keep
 *   it, show the button, and call prompt() on tap.
 * - iPhone and iPad Safari have no install API: the button opens a short
 *   "Share, then Add to Home Screen" guide instead.
 * - Already installed (running standalone), or any other browser: hidden.
 *
 * `beforeinstallprompt` fires only while the manifest meets Chrome's install criteria.
 */

/** Chrome's `beforeinstallprompt` event; not yet in the DOM types. */
interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** iOS Safari's `navigator.standalone` is not in the DOM types either. */
type InstallNavigator = Pick<Navigator, 'userAgent' | 'maxTouchPoints'> & { standalone?: boolean };

/** The parts of `window` the button uses, so tests can pass a stand-in. */
export type InstallWindow = Pick<Window, 'addEventListener' | 'removeEventListener' | 'matchMedia'> & {
  navigator: InstallNavigator;
};

export const isStandalone = (win: InstallWindow): boolean =>
  win.matchMedia?.('(display-mode: standalone)').matches || win.navigator.standalone === true;

/** iPadOS 13 and later says it is a Mac; touch support tells them apart. Other iOS browsers cannot add to the home screen the same way. */
export function isIosSafari(nav: InstallNavigator): boolean {
  const ua = nav.userAgent || '';
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && (nav.maxTouchPoints || 0) > 1);
  return ios && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
}

/** Wires the button up; returns a function that stops listening. */
export function mountInstallButton(
  button: HTMLButtonElement,
  guide: HTMLDialogElement,
  win: InstallWindow = window,
): () => void {
  if (isStandalone(win)) return () => {};
  const ios = isIosSafari(win.navigator);
  let deferred: InstallPromptEvent | undefined;

  const onPrompt = (event: Event) => {
    event.preventDefault(); // the button stands in for the browser's own mini-infobar
    deferred = event as InstallPromptEvent;
    button.hidden = false;
  };
  const onInstalled = () => {
    deferred = undefined;
    button.hidden = true;
  };
  win.addEventListener('beforeinstallprompt', onPrompt);
  win.addEventListener('appinstalled', onInstalled);

  if (ios) button.hidden = false;

  button.addEventListener('click', async () => {
    if (deferred) {
      const event = deferred;
      deferred = undefined; // a prompt can be shown only once
      await event.prompt();
      const { outcome } = await event.userChoice;
      if (outcome === 'accepted') button.hidden = true;
    } else if (ios) guide.showModal();
  });

  return () => {
    win.removeEventListener('beforeinstallprompt', onPrompt);
    win.removeEventListener('appinstalled', onInstalled);
  };
}
