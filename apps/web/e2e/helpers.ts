import { expect, type Page } from '@playwright/test';

export const deploy = async (page: Page, build: 'A' | 'B' | 'T') => {
  const res = await page.request.get(`/__deploy/${build}`);
  expect(res.ok()).toBe(true);
};

/** Turn the test server's outage on or off: every page a 502 while on. */
export const outage = async (page: Page, on: boolean) => {
  const res = await page.request.get(`/__down/${on ? 'on' : 'off'}`);
  expect(res.ok()).toBe(true);
};

/** Wait until every interactive island on the page has loaded its code (Astro drops `ssr` then). */
export const hydrated = (page: Page) => expect(page.locator('astro-island[ssr]')).toHaveCount(0);

/** Wait until the offline worker controls the page and has saved every page. */
export async function waitForOffline(page: Page) {
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }),
      );
    }
    // The worker answers on the channel once it has saved the pages not saved at install.
    const channel = new MessageChannel();
    const filled = new Promise((resolve) => (channel.port1.onmessage = resolve));
    reg.active!.postMessage('fill', [channel.port2]);
    await filled;
  });
}

const continueButton = (page: Page) => page.getByRole('button', { name: /^(Continue|Finish)$/ });
const next = (page: Page) => continueButton(page).click();

/** After an answer, focus is on Continue, so keyboard users never lose their place. */
const answered = async (page: Page) => {
  await expect(page.getByText('You found it.')).toBeVisible();
  await expect(continueButton(page)).toBeFocused();
  await next(page);
};

export const choose = async (page: Page, option: string) => {
  await page.getByRole('button', { name: option, exact: true }).click();
  await answered(page);
};

export const typeMove = async (page: Page, move: string) => {
  await page.getByLabel('Or type your move').fill(move);
  await page.getByRole('button', { name: 'Play' }).click();
  await answered(page);
};

/** Plays a lesson through, answering every step correctly first time. */
export async function completeLesson(page: Page, slug: 'board' | 'hanging') {
  await page.goto(`/chess/${slug}/`);
  await hydrated(page);
  if (slug === 'board') {
    // Meet the six pieces first.
    for (let i = 0; i < 6; i++) await next(page);
    await choose(page, 'h1, a light square');
    await choose(page, 'd1');
    await typeMove(page, 'e4');
  } else {
    await next(page);
    await typeMove(page, 'Qxd5');
    await typeMove(page, 'dxe5');
    await choose(page, 'Checks, captures and threats');
  }
  await expect(page.getByTestId('lesson-done')).toContainText('Saved on this device');
}

export const lessonsFinished = async (page: Page) => {
  await page.goto('/progress/');
  return page.getByTestId('lessons-finished');
};

/** Sum the page's layout shifts (CLS); under 0.1 is good. */
export async function watchShifts(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { shift: number }).shift = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
        if (!entry.hadRecentInput) (window as unknown as { shift: number }).shift += entry.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  return async () => {
    await page.waitForTimeout(500);
    return page.evaluate(() => (window as unknown as { shift: number }).shift);
  };
}
