import { expect, test } from '@playwright/test';
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

test('missing a question in the check leads into the lesson itself', async ({ page }) => {
  await page.goto('/chess/board/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Take the check' }).click();
  for (let i = 0; i < 2; i++) await page.getByRole('button', { name: 'a1, a dark square', exact: true }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await choose(page, 'd1');
  await typeMove(page, 'e4');
  await expect(page.getByText('Not quite')).toBeVisible();
});
