import { expect, test } from '@playwright/test';
import { deploy, hydrated } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

test('puzzles by theme: ten at a time, the answer shown on request, and a score at the end', async ({ page }) => {
  await page.goto('/chess/puzzles/?theme=fork');
  await hydrated(page);
  await expect(page.getByLabel('Theme')).toHaveValue(/./);
  await expect(page.getByLabel('Theme').locator('option:checked')).toHaveText('Fork');
  await page.getByRole('button', { name: 'Start ten puzzles' }).click();
  for (let i = 1; i <= 10; i++) {
    await expect(page.getByText(`Puzzle ${i} of 10`)).toBeVisible();
    await page.getByRole('button', { name: 'Show the answer' }).click();
    await page.getByRole('button', { name: i === 10 ? 'Finish' : 'Next puzzle' }).click();
  }
  await expect(page.getByTestId('puzzle-result')).toHaveText('0 of 10 solved first time.');
  await expect(page.getByText('Your best for fork: 0 of 10')).toBeVisible();
});
