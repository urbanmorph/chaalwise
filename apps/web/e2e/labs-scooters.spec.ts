import { expect, test } from '@playwright/test';
import { DONE_KEY } from '../src/lib/done-lessons';
import { deploy, hydrated, watchShifts } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

test('Used scooters: price alone, a mechanic’s check, warranties, then the debrief and the "played" record', async ({
  page,
}) => {
  await page.goto('/progress/');
  await hydrated(page);
  const when = page.getByTestId('lab-played-used-scooters').locator('dd');
  await expect(when).toHaveText('Not yet');

  const shifts = await watchShifts(page);
  await page.goto('/labs/used-scooters/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Start the first day' }).click();
  const head = page.getByTestId('sc-head');
  const status = page.getByTestId('sc-status');
  const points = page.getByTestId('sc-you');
  const next = () => page.getByRole('button', { name: 'Next day' }).click();

  // Price alone. Near the average price, only poor scooters are sold.
  await expect(head).toBeFocused();
  await expect(head).toContainText('Price alone');
  await page.getByRole('button', { name: 'Offer 75' }).click();
  await expect(status).toBeFocused();
  await expect(status).toContainText('would sell at 75');
  await expect(status).toContainText('a poor one, worth 30 to you. -45 points.');
  await expect(points).toHaveText('-45');
  await next();
  await page.getByRole('button', { name: 'Offer 25' }).click();
  await expect(status).toContainText('a poor one, worth 30 to you. +5 points.');
  await expect(points).toHaveText('-40');
  await next();
  await page.getByRole('button', { name: 'Offer 90' }).click();
  await expect(status).toContainText('would sell at 90');
  await next();

  // A mechanic's check: pay for it, then offer what the scooter is worth paying for.
  await expect(head).toContainText('A mechanic’s check');
  await page.getByRole('button', { name: "Pay 10 for a mechanic's check" }).click();
  await expect(status).toContainText('The mechanic says');
  const good = (await status.textContent())!.includes('scooter is good');
  await page.getByRole('button', { name: good ? 'Offer 90' : 'Offer 25' }).click();
  await expect(status).toContainText(good ? '+30 points, after the check' : '-5 points, after the check');
  await next();
  await page.getByRole('button', { name: 'Buy nothing' }).click();
  await expect(status).toContainText('You buy nothing today.');
  await next();
  await page.getByRole('button', { name: 'Offer 50' }).click();
  await next();

  // Warranties: only the seller of a good scooter offers one.
  await expect(head).toContainText('Warranties');
  for (let day = 7; day <= 9; day++) {
    if (day > 7) await next();
    await expect(page.getByTestId('sc-day')).toContainText(String(day));
    const stall = page.getByRole('listitem').filter({ hasText: 'with a 3-month warranty' });
    const seller = await stall.locator('strong').textContent();
    if (day < 9) {
      await page.getByRole('button', { name: `Buy from ${seller}, 90` }).click();
      await expect(status).toContainText('a good one, worth 130 to you. +40 points.');
    } else {
      await page.getByRole('button', { name: /^Buy from .+, 50$/ }).click();
      await expect(status).toContainText('a poor one, worth 30 to you. -20 points.');
    }
  }
  // Played to the end: met, and its questions open up in practice.
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), DONE_KEY)).toContain('labs/used-scooters');

  await page.getByRole('button', { name: 'See the debrief' }).click();
  const debrief = page.getByTestId('sc-debrief');
  await expect(debrief.getByRole('heading', { name: 'Debrief' })).toBeFocused();
  await expect(debrief.getByRole('table').first().getByRole('row')).toHaveCount(10);
  await expect(page.getByTestId('sc-prices').getByRole('row')).toHaveCount(5);
  await expect(debrief).toContainText('This is adverse selection');
  await expect(debrief).toContainText('12.5 points a day on average');
  await expect(debrief.getByRole('link', { name: 'A bet tells a story' })).toHaveAttribute(
    'href',
    '/skills/a-bet-tells-a-story/',
  );
  expect(await shifts()).toBeLessThan(0.1);
  await expect(page.locator('section.try .stage')).toHaveAttribute('data-steps', /"measures":"read-hidden"/);

  await page.goto('/progress/');
  await hydrated(page);
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  await expect(when).toHaveText(today);
});
