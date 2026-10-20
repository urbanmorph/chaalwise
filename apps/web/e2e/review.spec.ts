import { expect, test } from '@playwright/test';
import { completeLesson, deploy } from './helpers';

const ANSWERS: [RegExp, (page: import('@playwright/test').Page) => Promise<void>][] = [
  [/corner on your right/, (p) => p.getByRole('button', { name: 'h1, a light square' }).click()],
  [/white queen start/, (p) => p.getByRole('button', { name: 'd1', exact: true }).click()],
  [
    /pawn in front of your king/,
    async (p) => {
      await p.getByLabel('Or type your move').fill('e4');
      await p.getByRole('button', { name: 'Play' }).click();
    },
  ],
];

test('a finished lesson comes back for review on a later day', async ({ page }) => {
  await deploy(page, 'A');
  await page.clock.install({ time: new Date('2026-10-18T09:00:00') });
  await completeLesson(page, 'board');

  await page.goto('/review/');
  await expect(page.getByTestId('review-empty')).toBeVisible();

  await page.clock.setSystemTime(new Date('2026-11-18T09:00:00'));
  await page.goto('/review/');
  await expect(page.getByText('3 to review')).toBeVisible();
  for (let i = 0; i < 3; i++) {
    const prompt = await page.locator('.player').getByRole('heading', { level: 2 }).textContent();
    const [, answer] = ANSWERS.find(([pattern]) => pattern.test(prompt ?? ''))!;
    await answer(page);
    await expect(page.getByText('You found it!')).toBeVisible();
    await page.getByRole('button', { name: /^(Continue|Finish)$/ }).click();
  }
  await expect(page.getByText('Round done')).toBeVisible();
  await expect(page.getByText('Saved on this device.')).toBeVisible();

  // Remembered first time, so not due again the same day.
  await page.goto('/review/');
  await expect(page.getByTestId('review-empty')).toBeVisible();
});
