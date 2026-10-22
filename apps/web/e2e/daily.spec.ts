import { expect, test } from '@playwright/test';
import { deploy, hydrated } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

test('today’s puzzle starts a streak that is kept on the device, and counts the day once', async ({ page }) => {
  await page.goto('/daily/');
  await hydrated(page);
  const streak = page.getByTestId('daily-streak');
  await expect(streak).toContainText('Solve today’s puzzle to start a streak');
  await expect(page.getByText('find the best move')).toBeVisible();
  await page.getByRole('button', { name: 'Show the answer' }).click();
  await expect(page.getByText('The answer is played on the board')).toBeVisible();
  await expect(streak).toContainText('1 day in a row, today included');

  await page.reload();
  await hydrated(page);
  await expect(streak).toContainText('1 day in a row, today included');
  await expect(page.getByText('find the best move')).toBeVisible();
});
