import { expect, test } from '@playwright/test';
import { deploy, hydrated } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

test('poker drills: a round of ten calls or folds, each explained, with the best score kept on the device', async ({
  page,
}) => {
  await page.goto('/poker/drills/');
  await hydrated(page);
  await expect(page.getByRole('link', { name: 'Play your first hands' })).toBeVisible();
  const drill = page.locator('section#call-or-fold');
  await drill.getByRole('button', { name: 'Start' }).click();
  for (let i = 1; i <= 10; i++) {
    await expect(drill.getByText(`${i} of 10 ·`)).toBeVisible();
    await expect(drill.getByRole('heading', { level: 3 })).toContainText('In poker, the pot holds');
    await expect(drill.getByText(/^Pot: \d+ points, \d+ points? to call$/)).toBeVisible();
    await drill.getByRole('button', { name: 'Call', exact: true }).click();
    await expect(drill.getByRole('status')).toContainText(/the price is \d+%/);
    const next = drill.getByRole('button', { name: i === 10 ? 'Finish' : 'Next' });
    await expect(next).toBeFocused();
    await next.click();
  }
  await expect(drill.getByText(/^You got \d+ of 10 right\.$/)).toBeFocused();
  await expect(drill.getByText(/Best \d+ · last \d+\s·\sdone today/)).toBeVisible();
});

test('count the outs: type the number, then see which cards they are', async ({ page }) => {
  await page.goto('/poker/drills/#count-the-outs');
  await hydrated(page);
  const drill = page.locator('section#count-the-outs');
  await drill.getByRole('button', { name: 'Start' }).click();
  await expect(drill.getByLabel('Your cards').getByRole('img')).toHaveCount(2);
  const input = drill.getByLabel('Your answer');
  await expect(input).toBeFocused();
  await input.fill('9');
  await input.press('Enter');
  await expect(drill.getByRole('status')).toContainText(/\d+ outs?\. .*makes? a (flush|straight)/);
  await expect(drill.getByRole('status')).toContainText(/rule of (two|four)/);
});
