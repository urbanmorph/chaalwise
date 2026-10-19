import { expect, test } from '@playwright/test';
import { completeLesson, deploy, lessonsFinished, waitForOffline } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

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

test('a page that is not saved shows an offline message, not an error', async ({ page, context }) => {
  await page.goto('/');
  await waitForOffline(page);
  await context.setOffline(true);
  const res = await page.goto('/chess/not-a-lesson/');
  expect(res?.status()).toBe(503);
  await expect(page.getByText('You are offline')).toBeVisible();
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
