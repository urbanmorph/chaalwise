import { expect, test } from '@playwright/test';
import { deploy, hydrated } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

test('a strategy lesson ends with a plan you keep, and the review asks a day later whether you used it', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-10-20T09:00:00') });
  await page.goto('/skills/blunder-check/');
  await hydrated(page);
  // The plan is the last step; the step dots go straight to it.
  const dots = page.getByRole('navigation', { name: 'Steps in this lesson' }).getByRole('button');
  await dots.last().click();
  await page.getByLabel('When, in your own words').fill('I reply to a client');
  await expect(page.getByText('When I reply to a client, I will name one thing that could go wrong')).toBeVisible();
  await page.getByRole('button', { name: 'Save my plan' }).click();
  await expect(page.getByText('Saved on this device.')).toBeVisible();

  // Not the same day.
  await page.goto('/review/');
  await hydrated(page);
  await expect(page.getByTestId('plan-check-in')).toHaveCount(0);

  await page.clock.setSystemTime(new Date('2026-10-21T10:00:00'));
  await page.goto('/review/');
  const card = page.getByTestId('plan-check-in');
  await expect(card).toContainText('Your plan: When I reply to a client');
  await card.getByRole('button', { name: 'I used it' }).click();
  await expect(card).toContainText('Was it a good decision, whatever the result?');

  // Answered: not asked again for a week.
  await page.goto('/review/');
  await hydrated(page);
  await expect(page.getByTestId('plan-check-in')).toHaveCount(0);
});
