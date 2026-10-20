import { expect, test } from '@playwright/test';
import { deploy, hydrated, watchShifts } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

test('Split the pie: five negotiations, with offers, counters and walk-aways, then the debrief', async ({ page }) => {
  const shifts = await watchShifts(page);
  await page.goto('/labs/split-the-pie/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Start the first round' }).click();

  const input = page.getByLabel('Your offer: points for you');
  const offer = async (points: number) => {
    await input.fill(String(points));
    await input.press('Enter');
  };
  const status = page.getByTestId('split-status');
  const next = () => page.getByRole('button', { name: 'Next round' }).click();

  // Round 1, a fair bot: an even split is accepted at once.
  await expect(input).toBeFocused();
  await offer(50);
  await expect(status).toContainText('Fair bot accepts your offer. Deal: 50 points to you');
  await expect(status).toBeFocused();
  await expect(page.getByTestId('split-you')).toHaveText('50');
  await next();

  // Round 2, an anchoring bot opens high; take its offer.
  await expect(status).toContainText('Anchoring bot opens');
  await page.getByRole('button', { name: /^Accept \d+$/ }).click();
  await expect(status).toContainText('You accept. Deal:');
  await next();

  // Round 3, a tough bot: it counters twice, its second counter is its last, then walk away.
  await offer(90);
  await expect(status).toContainText('Tough bot counters');
  await expect(input).toBeFocused();
  await offer(85);
  await expect(status).toContainText('That is its last offer');
  await expect(input).toBeHidden();
  await expect(page.getByRole('button', { name: /^Accept \d+$/ })).toBeFocused();
  await expect(page.getByRole('row')).toHaveCount(5);
  await page.getByRole('button', { name: 'Walk away' }).click();
  await expect(status).toContainText('No deal: you get your walk-away');
  await next();

  // Round 4 has no deal zone: walking away is right.
  await page.getByRole('button', { name: 'Walk away' }).click();
  await expect(status).toContainText('there was no deal zone');
  await next();

  // Round 5: a high first offer, then the bot's counter.
  await offer(80);
  await expect(status).toContainText('Anchoring bot');
  await page.getByRole('button', { name: /^Accept \d+$/ }).click();

  await page.getByRole('button', { name: 'See the debrief' }).click();
  const debrief = page.getByTestId('split-debrief');
  await expect(debrief.getByRole('heading', { name: 'Debrief' })).toBeFocused();
  await expect(debrief.getByRole('row')).toHaveCount(6);
  await expect(debrief).toContainText('The deal zone lies between the two walk-away points');
  await expect(debrief).toContainText('BATNA');
  expect(await shifts()).toBeLessThan(0.1);
  await expect(page.locator('section.try .stage')).toHaveAttribute(
    'data-steps',
    /reference\/strategy\/walk-away-point\//,
  );
  await expect(page.locator('section.try .stage')).toHaveAttribute('data-steps', /"measures":"value"/);
});
