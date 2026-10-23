import { expect, test, type Page } from '@playwright/test';
import { RESUME_KEY } from '../src/lib/resume';
import { choose, deploy, hydrated, typeMove, watchShifts } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

/** Start the hanging-pieces lesson and leave it at step 3 of 4, one question answered. */
async function leaveAtStepThree(page: Page) {
  await page.goto('/chess/hanging/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Continue' }).click();
  await typeMove(page, 'Qxd5');
  await expect(page.getByText('Step 3 of 4', { exact: true })).toBeVisible();
}

const offer = (page: Page) => page.getByTestId('resume');

test('coming back to a lesson left part-way offers to carry on from that step, with the answers kept', async ({
  page,
}) => {
  await leaveAtStepThree(page);
  const shifts = await watchShifts(page);
  await page.goto('/chess/hanging/');
  // Drawn with the page, before the lesson's code has loaded, so nothing jumps.
  await expect(offer(page)).toContainText('step 3 of 4');
  await hydrated(page);
  expect(await shifts()).toBeLessThan(0.01);

  await offer(page).getByRole('button', { name: 'Carry on', exact: true }).click();
  await expect(offer(page)).toBeHidden();
  await expect(page.getByText('Step 3 of 4', { exact: true })).toBeVisible();
  // The answer from before is kept: step 2 is done, and is not asked again.
  await expect(page.getByRole('button', { name: 'Step 2, done' })).toBeVisible();
  await typeMove(page, 'dxe5');
  await choose(page, 'Checks, captures and threats');
  // All three questions count, the one answered before leaving among them.
  await expect(page.getByTestId('lesson-done')).toContainText('3 of 3 right first time');
  await expect(page.getByTestId('lesson-done')).toContainText('Saved on this device');

  // Finished: nothing left to carry on.
  expect(await page.evaluate((key) => localStorage.getItem(key), RESUME_KEY)).toBeNull();
  await page.goto('/chess/hanging/');
  await hydrated(page);
  await expect(offer(page)).toBeHidden();
});

test('starting again forgets the place, and a fresh lesson offers nothing', async ({ page }) => {
  await page.goto('/chess/hanging/');
  await hydrated(page);
  await expect(offer(page)).toBeHidden();

  await leaveAtStepThree(page);
  await page.goto('/chess/hanging/');
  await hydrated(page);
  await offer(page).getByRole('button', { name: 'Start again' }).click();
  await expect(offer(page)).toBeHidden();
  await expect(page.getByText('Step 1 of 4', { exact: true })).toBeVisible();
  await page.goto('/chess/hanging/');
  await hydrated(page);
  await expect(offer(page)).toBeHidden();
});

test('the place in a lesson and the daily streak go into the progress file, and carry on from it on another device', async ({
  page,
  browser,
}) => {
  await page.goto('/daily/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Show the answer' }).click();
  await expect(page.getByTestId('daily-streak')).toContainText('1 day in a row, today included');
  await leaveAtStepThree(page);
  await page.goto('/progress/');
  await hydrated(page);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Save progress to a file' }).click(),
  ]);
  const file = await download.path();

  // Another device: a browser with nothing saved.
  const other = await browser.newContext();
  const fresh = await other.newPage();
  await fresh.goto('/progress/');
  await hydrated(fresh);
  await fresh.getByLabel('Load a progress file').setInputFiles(file);
  await fresh.getByRole('button', { name: 'Replace my progress' }).click();
  await expect(fresh.getByText(/^Progress loaded from/)).toBeVisible();
  await fresh.goto('/chess/hanging/');
  await expect(offer(fresh)).toContainText('step 3 of 4');
  await fresh.goto('/daily/');
  await hydrated(fresh);
  await expect(fresh.getByTestId('daily-streak')).toContainText('1 day in a row, today included');
  await other.close();
});
