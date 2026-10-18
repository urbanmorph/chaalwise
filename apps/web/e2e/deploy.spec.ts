import { expect, test, type Page } from '@playwright/test';
import { completeLesson, deploy, lessonsFinished, waitForOffline } from './helpers';

/** Every script and stylesheet response the page received, with its type. */
function trackAssets(page: Page) {
  const seen: { url: string; status: number; type: string }[] = [];
  page.on('response', (r) => {
    if (/\.(js|css)$/.test(new URL(r.url()).pathname)) {
      seen.push({ url: r.url(), status: r.status(), type: r.headers()['content-type'] ?? '' });
    }
  });
  return seen;
}

test('after a deploy, a learner on version A gets version B with no stale files', async ({
  page,
  context,
}) => {
  await deploy(page, 'A');
  await page.goto('/chess/board/');
  await waitForOffline(page);
  await expect(page.locator('section.player')).toHaveAttribute('data-build', 'A');

  await deploy(page, 'B');
  const assets = trackAssets(page);
  await page.reload();
  // The page and its scripts are B's straight away: pages are fetched network-first.
  await expect(page.locator('html')).toHaveAttribute('data-build', 'B');
  await expect(page.locator('section.player')).toHaveAttribute('data-build', 'B');
  expect(assets.filter((a) => a.status !== 200 || /html/.test(a.type))).toEqual([]);

  // The new worker waits for the learner, then takes over on "Reload".
  const reloaded = page.waitForEvent('load');
  await page.getByRole('button', { name: 'Reload' }).click();
  await reloaded;
  await waitForOffline(page);

  // Offline, the saved copy is B's too.
  await context.setOffline(true);
  await page.goto('/chess/hanging/');
  await expect(page.locator('section.player')).toHaveAttribute('data-build', 'B');
  const cacheNames = await page.evaluate(() => caches.keys());
  expect(cacheNames.filter((k) => k.startsWith('pages-'))).toHaveLength(1);
});

test('the tombstone removes the worker and its caches, and keeps learner progress', async ({
  page,
}) => {
  await deploy(page, 'A');
  await page.goto('/');
  await waitForOffline(page);
  await completeLesson(page, 'board');

  await deploy(page, 'T');
  // The tombstone reloads open tabs once it has removed itself: wait for that second load.
  let loads = 0;
  page.on('load', () => loads++);
  await page.goto('/');
  await expect.poll(() => loads).toBe(2);
  await expect
    .poll(() =>
      page.evaluate(async () => ({
        workers: (await navigator.serviceWorker.getRegistrations()).length,
        caches: (await caches.keys()).length,
      })),
    )
    .toEqual({ workers: 0, caches: 0 });
  // And it stays gone: no reload loop.
  await page.waitForTimeout(1000);
  expect(loads).toBe(2);

  await expect(await lessonsFinished(page)).toHaveText('1');
});
