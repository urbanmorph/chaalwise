import { describe, expect, it, vi } from 'vitest';
import { isIosSafari, isStandalone, mountInstallButton, type InstallWindow } from '../src/lib/install';

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const IPHONE_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0 Mobile/15E148 Safari/604.1';
const MAC_SAFARI =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const DESKTOP_CHROME =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

const fakeWindow = (
  userAgent = DESKTOP_CHROME,
  { standalone = false, maxTouchPoints = 0, displayStandalone = false } = {},
): InstallWindow & EventTarget => {
  const target = new EventTarget();
  return Object.assign(target, {
    matchMedia: (query: string) => ({ matches: displayStandalone && query === '(display-mode: standalone)' }),
    navigator: { userAgent, maxTouchPoints, standalone },
  }) as unknown as InstallWindow & EventTarget;
};

const fakeButton = () => {
  const target = new EventTarget();
  return Object.assign(target, { hidden: true }) as unknown as HTMLButtonElement;
};

const fakeGuide = () => ({ showModal: vi.fn() }) as unknown as HTMLDialogElement;

/** A `beforeinstallprompt` event, as Chrome fires it. */
const installPrompt = (outcome: 'accepted' | 'dismissed') =>
  Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt: vi.fn(async () => {}),
    userChoice: Promise.resolve({ outcome }),
  });

const click = async (button: HTMLButtonElement) => {
  button.dispatchEvent(new Event('click'));
  await new Promise((resolve) => setTimeout(resolve));
};

describe('isStandalone', () => {
  it('is true when the app runs from the home screen or as an installed app', () => {
    expect(isStandalone(fakeWindow(DESKTOP_CHROME, { displayStandalone: true }))).toBe(true);
    expect(isStandalone(fakeWindow(IPHONE_SAFARI, { standalone: true }))).toBe(true);
  });
  it('is false in a browser tab', () => {
    expect(isStandalone(fakeWindow())).toBe(false);
  });
});

describe('isIosSafari', () => {
  it('knows iPhone Safari, and iPad Safari that calls itself a Mac', () => {
    expect(isIosSafari(fakeWindow(IPHONE_SAFARI).navigator)).toBe(true);
    expect(isIosSafari(fakeWindow(MAC_SAFARI, { maxTouchPoints: 5 }).navigator)).toBe(true);
  });
  it('leaves out other browsers on iOS, desktop Safari and Chrome', () => {
    expect(isIosSafari(fakeWindow(IPHONE_CHROME).navigator)).toBe(false);
    expect(isIosSafari(fakeWindow(MAC_SAFARI).navigator)).toBe(false);
    expect(isIosSafari(fakeWindow(DESKTOP_CHROME).navigator)).toBe(false);
  });
});

describe('mountInstallButton', () => {
  it('stays hidden where the browser offers no install, such as Firefox desktop', () => {
    const button = fakeButton();
    mountInstallButton(button, fakeGuide(), fakeWindow());
    expect(button.hidden).toBe(true);
  });

  it('shows when the browser offers an install, and prompts on tap', async () => {
    const win = fakeWindow();
    const button = fakeButton();
    mountInstallButton(button, fakeGuide(), win);
    const event = installPrompt('accepted');
    win.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(button.hidden).toBe(false);

    await click(button);
    expect(event.prompt).toHaveBeenCalledOnce();
    expect(button.hidden).toBe(true);
  });

  it('stays shown if the learner dismisses the prompt, and the used prompt is not reused', async () => {
    const win = fakeWindow();
    const button = fakeButton();
    mountInstallButton(button, fakeGuide(), win);
    const event = installPrompt('dismissed');
    win.dispatchEvent(event);
    await click(button);
    await click(button);
    expect(event.prompt).toHaveBeenCalledOnce();
    expect(button.hidden).toBe(false);
  });

  it('hides once the app is installed', () => {
    const win = fakeWindow();
    const button = fakeButton();
    mountInstallButton(button, fakeGuide(), win);
    win.dispatchEvent(installPrompt('accepted'));
    win.dispatchEvent(new Event('appinstalled'));
    expect(button.hidden).toBe(true);
  });

  it('on iPhone Safari, shows and opens the Add to Home Screen guide', async () => {
    const button = fakeButton();
    const guide = fakeGuide();
    mountInstallButton(button, guide, fakeWindow(IPHONE_SAFARI));
    expect(button.hidden).toBe(false);
    await click(button);
    expect(guide.showModal).toHaveBeenCalledOnce();
  });

  it('stays hidden when already installed, even if the browser fires a prompt', () => {
    const win = fakeWindow(IPHONE_SAFARI, { standalone: true });
    const button = fakeButton();
    mountInstallButton(button, fakeGuide(), win);
    win.dispatchEvent(installPrompt('accepted'));
    expect(button.hidden).toBe(true);
  });

  it('stops listening when unmounted', () => {
    const win = fakeWindow();
    const button = fakeButton();
    mountInstallButton(button, fakeGuide(), win)();
    win.dispatchEvent(installPrompt('accepted'));
    expect(button.hidden).toBe(true);
  });
});
