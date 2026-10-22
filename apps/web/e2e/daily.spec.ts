import { expect, test } from '@playwright/test';
import { deploy, hydrated } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

test('today’s puzzle starts a streak that is kept on the device, and counts the day once', async ({ page }) => {
  await page.goto('/daily/');
  await hydrated(page);
  const streak = page.getByTestId('daily-streak');
  await expect(streak).toContainText('Solve one of today’s puzzles to start a streak');
  await expect(page.getByText('find the best move')).toBeVisible();
  await page.getByRole('button', { name: 'Show the answer' }).click();
  await expect(page.getByText('The answer is played on the board')).toBeVisible();
  await expect(streak).toContainText('1 day in a row, today included');

  await page.reload();
  await hydrated(page);
  await expect(streak).toContainText('1 day in a row, today included');
  await expect(page.getByText('find the best move')).toBeVisible();
});

test('today’s poker puzzle is answered once a day, and keeps the streak too', async ({ page }) => {
  await page.goto('/daily/');
  await hydrated(page);
  const poker = page.getByRole('region', { name: 'Today’s poker puzzle' });
  await expect(poker.getByText('In poker')).toBeVisible();
  const choice = poker.locator('.choices button').first();
  if (await choice.count()) await choice.click();
  else {
    await poker.getByLabel('Your answer').fill('4');
    await poker.getByRole('button', { name: 'Answer' }).click();
  }
  await expect(poker.getByRole('status')).toContainText(/Right\.|Not quite\./);
  await expect(page.getByTestId('daily-streak')).toContainText('1 day in a row, today included');
});
