import { expect, test, type Page } from '@playwright/test';
import { choose, deploy, hydrated, lessonsFinished, typeMove } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

test('a learner who already knows a chess lesson can pass its check and move on', async ({ page }) => {
  await page.goto('/chess/board/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Take the check' }).click();
  // Only the questions: no reading steps.
  await expect(page.getByRole('navigation', { name: 'Steps in this lesson' }).getByRole('button')).toHaveCount(3);
  await choose(page, 'h1, a light square');
  await choose(page, 'd1');
  await typeMove(page, 'e4');
  await expect(page.getByTestId('check-passed')).toContainText('Saved on this device');
  await expect(await lessonsFinished(page)).toContainText('1');
});

/** Take the board lesson's check and miss its second question, the queen's square. */
async function missTheQueen(page: Page) {
  await page.goto('/chess/board/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Take the check' }).click();
  await choose(page, 'h1, a light square');
  for (let i = 0; i < 2; i++) await page.getByRole('button', { name: 'e1', exact: true }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await typeMove(page, 'e4');
}

test('missing a question in the check opens the lesson at that question, with the right answers kept', async ({
  page,
}) => {
  await missTheQueen(page);
  // The banner names the question missed, and the lesson opens there, not at the start.
  const missed = page.getByTestId('check-missed');
  await expect(missed).toContainText('2 of 3 right first time');
  await expect(missed).toContainText('step 8, marked on the steps below');
  await expect(page.getByText('Step 8 of 9', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Step 7, done' })).toBeVisible();

  // The missed question is asked again; the one right in the check can be passed.
  await expect(page.getByRole('button', { name: 'Continue' })).toHaveCount(0);
  await choose(page, 'd1');
  await expect(page.getByText('You got this one right already')).toBeVisible();
  await page.getByRole('button', { name: 'Finish' }).click();
  await expect(page.getByTestId('lesson-done')).toContainText('2 of 3 right first time');
  await expect(page.getByTestId('lesson-done')).toContainText('Saved on this device');
});

test('after a missed check, the lesson can still start from the beginning', async ({ page }) => {
  await missTheQueen(page);
  await page.getByRole('button', { name: 'Start from the beginning' }).click();
  await expect(page.getByText('Step 1 of 9', { exact: true })).toBeVisible();
  // Past the six steps that meet the pieces, to the question right in the check.
  for (let i = 0; i < 6; i++) await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByText('You got this one right already')).toBeVisible();
});
