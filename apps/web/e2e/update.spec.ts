import { expect, test, type Page } from '@playwright/test';
import { deploy, waitForOffline } from './helpers';

const checkForUpdate = (page: Page) =>
  page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update());

test('accepting an update reloads the tab, even on the first visit', async ({ page }) => {
  await deploy(page, 'A');
  // No worker controls this tab when it loads: it is the learner's first visit.
  await page.goto('/chess/board/');
  await waitForOffline(page);

  await deploy(page, 'B');
  await checkForUpdate(page);
  await expect(page.getByText('A new version of Chaalwise is ready.')).toBeVisible();
  const reloaded = page.waitForEvent('load');
  await page.getByRole('button', { name: 'Reload' }).click();
  await reloaded;
  await expect(page.locator('section.player')).toHaveAttribute('data-build', 'B');
});

test('accepting in one tab does not reload a lesson open in another', async ({ context }) => {
  const first = await context.newPage();
  await deploy(first, 'A');
  await first.goto('/');
  await waitForOffline(first);
  await first.reload(); // now controlled from the start
  const second = await context.newPage();
  await second.goto('/chess/board/');
  let secondLoads = 0;
  second.on('load', () => secondLoads++);

  await deploy(first, 'B');
  await checkForUpdate(first);
  await expect(first.getByText('A new version of Chaalwise is ready.')).toBeVisible();
  const reloaded = first.waitForEvent('load');
  await first.getByRole('button', { name: 'Reload' }).click();
  await reloaded;

  await expect(second.getByText('Chaalwise was updated in another tab.')).toBeVisible();
  expect(secondLoads).toBe(0);
  await expect(second.locator('section.player')).toHaveAttribute('data-build', 'A');
});
