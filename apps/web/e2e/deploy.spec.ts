import { expect, test, type Page } from '@playwright/test';
import { completeLesson, deploy, hydrated, lessonsFinished, waitForOffline } from './helpers';

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

test('after a deploy, a learner on version A gets version B with no stale files', async ({ page, context }) => {
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
  // A's build files are kept too, for any tab still on A; nothing older.
  expect(cacheNames.filter((k) => k.startsWith('assets'))).toHaveLength(2);
});

test.describe('with no offline worker: a first visit, or a browser that has cleared it', () => {
  test.use({ serviceWorkers: 'block' });

  /** Fails the lesson's code with a 404, as if a deploy had removed it, for `times` requests (Astro retries each once). */
  async function loseLessonCode(page: Page, times: number) {
    const html = await (await page.request.get('/chess/board/')).text();
    const chunk = html.match(/component-url="([^"]+)"/)![1]!;
    let failed = 0;
    await page.route(
      (url) => url.pathname === chunk,
      (route) =>
        failed++ < times
          ? route.fulfill({ status: 404, contentType: 'text/html', body: 'not found' })
          : route.continue(),
    );
  }

  test('a lesson whose code has gone from the server reloads once, and starts', async ({ page }) => {
    await deploy(page, 'A');
    await loseLessonCode(page, 2);
    let loads = 0;
    page.on('load', () => loads++);
    await page.goto('/chess/board/');
    await hydrated(page);
    expect(loads).toBe(2);
  });

  test('code that keeps failing does not reload over and over', async ({ page }) => {
    await deploy(page, 'A');
    await loseLessonCode(page, 99);
    let loads = 0;
    page.on('load', () => loads++);
    await page.goto('/chess/board/');
    await expect.poll(() => loads).toBe(2);
    await page.waitForTimeout(1500);
    expect(loads).toBe(2);
  });
});

test('the tombstone removes the worker and its caches, and keeps learner progress', async ({ page }) => {
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
