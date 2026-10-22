import { expect, test } from '@playwright/test';
import { completeLesson, deploy, lessonsFinished, outage, waitForOffline } from './helpers';

test.beforeEach(async ({ page }) => {
  await deploy(page, 'A');
  await outage(page, false);
});

test('a learner finishes a lesson, goes offline, reloads, and finishes another', async ({ page, context }) => {
  await page.goto('/');
  await waitForOffline(page);
  await completeLesson(page, 'board');

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId('lesson-done')).toHaveCount(0);
  // A lesson never opened before: it was saved on the device in advance.
  await completeLesson(page, 'hanging');
  await expect(await lessonsFinished(page)).toHaveText('2');
});

test('a page that is not saved shows the offline page, styled like the site, and can be tried again', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await waitForOffline(page);
  await context.setOffline(true);
  const res = await page.goto('/chess/not-a-lesson/');
  expect(res?.status()).toBe(503);
  await expect(page.getByRole('heading', { name: 'You are offline' })).toBeVisible();
  await expect(page.locator('.site-header')).toBeVisible();

  await context.setOffline(false);
  await page.getByRole('link', { name: 'Try again' }).click();
  // Back online, the address asked for is fetched again: here, the site's not-found page.
  await expect(page.getByRole('heading', { name: "That page isn't here." })).toBeVisible();
  expect(new URL(page.url()).pathname).toBe('/chess/not-a-lesson/');
});

test('every page is saved soon after the first visit, without being opened', async ({ page, context }) => {
  await page.goto('/');
  await waitForOffline(page);
  await context.setOffline(true);
  await page.goto('/reference/');
  const link = page.locator('main a[href^="/reference/"]').first();
  const href = (await link.getAttribute('href'))!;
  const res = await page.goto(href);
  expect(res?.status()).toBe(200);
});

test('a server outage shows the saved copy of a page instead of the error', async ({ page }) => {
  await page.goto('/');
  await waitForOffline(page);
  await outage(page, true);
  try {
    const res = await page.goto('/chess/board/');
    expect(res?.status()).toBe(200);
    await expect(page.locator('section.player')).toBeVisible();
    // A page never saved has no copy to show: the server's own error comes through.
    const unsaved = await page.goto('/chess/not-a-lesson/');
    expect(unsaved?.status()).toBe(502);
  } finally {
    await outage(page, false);
  }
});

test('pages come from the network first when online', async ({ page }) => {
  await page.goto('/');
  await waitForOffline(page);
  const res = await page.goto('/chess/');
  expect(res?.fromServiceWorker()).toBe(true);
  // The worker passed it through from the network rather than answering from its cache.
  const timing = await page.evaluate(() => performance.getEntriesByType('navigation')[0]!.toJSON());
  expect(timing.transferSize).toBeGreaterThan(0);
});
