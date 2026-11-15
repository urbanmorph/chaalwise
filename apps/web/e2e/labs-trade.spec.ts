import { expect, test, type Page } from '@playwright/test';
import { DONE_KEY } from '../src/lib/done-lessons';
import { deploy, hydrated, watchShifts } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

/** Set the four issues of your offer, each by its option from 0 (best for the firm) to 4 (best for you), and make it. */
async function offer(page: Page, [salary, joining, home, training]: number[], points: number) {
  for (const [label, index] of [
    ['Salary', salary],
    ['Joining date', joining],
    ['Work from home', home],
    ['Training budget', training],
  ] as const)
    await page.getByLabel(label, { exact: true }).selectOption({ index });
  await page.getByRole('button', { name: `Offer this: ${points} points to you` }).click();
}

test('Trade what matters less: ask, trade with Meera, haggle with Rajan, then the debrief reveals their sheets', async ({
  page,
}) => {
  const shifts = await watchShifts(page);
  await page.goto('/labs/trade-what-matters-less/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Start the first talk' }).click();
  const status = page.getByTestId('tr-status');

  // Meera opens low on every issue; asking what matters to her names the joining date.
  await expect(page.getByRole('heading', { name: /^With Meera/ })).toBeFocused();
  await expect(status).toContainText('Meera opens: pay low in the band, join in 2 weeks');
  await page.getByRole('button', { name: 'Ask what matters most to Meera' }).click();
  await expect(status).toContainText('the joining date matters most to us');
  await expect(status).toBeFocused();
  await expect(page.getByRole('button', { name: 'Ask what matters most to Meera' })).toHaveCount(0);

  // Give her the date, keep the rest: she counters. Then meet her on salary: she accepts.
  await offer(page, [4, 0, 4, 4], 88);
  await expect(status).toContainText('Meera counters');
  await offer(page, [2, 0, 4, 4], 68);
  await expect(status).toContainText('Meera accepts your offer. Deal: 68 points to you, 60 to Meera, 128 in all.');
  await expect(page.getByTestId('tr-you')).toHaveText('68');
  await page.getByRole('button', { name: 'Next talk' }).click();

  // Rajan: haggle issue by issue down to the middle, which he takes with your last offer.
  await expect(page.getByRole('heading', { name: /^With Rajan/ })).toBeFocused();
  await offer(page, [4, 4, 4, 4], 100);
  await expect(status).toContainText('Rajan counters');
  await offer(page, [3, 3, 3, 3], 75);
  await expect(status).toContainText('Your next offer is your last: Rajan will answer it with yes or no.');
  await expect(status).toBeFocused();
  await offer(page, [2, 2, 2, 2], 50);
  await expect(status).toContainText('Deal: 50 points to you, 50 to Rajan, 100 in all.');
  await expect(page.getByTestId('tr-you')).toHaveText('118');

  await page.getByRole('button', { name: 'See the debrief' }).click();
  const debrief = page.getByTestId('tr-debrief');
  await expect(debrief.getByRole('heading', { name: 'Debrief' })).toBeFocused();
  await expect(debrief.getByRole('table').first().getByRole('row')).toHaveCount(3);
  await expect(debrief.getByRole('table').first()).toContainText('136');
  await expect(page.getByTestId('tr-sheets').getByRole('row')).toHaveCount(5);
  await expect(debrief).toContainText('Splitting each issue down the middle leaves points on the table');
  await expect(debrief).toContainText('ask about interests, not only positions');
  expect(await shifts()).toBeLessThan(0.1);
  await expect(page.locator('section.try .stage')).toHaveAttribute('data-steps', /"measures":"value"/);
});

test('Trade what matters less: two talks to the end record the lab as played, with the date', async ({ page }) => {
  await page.goto('/progress/');
  await hydrated(page);
  const when = page.getByTestId('lab-played-trade-what-matters-less').locator('dd');
  await expect(when).toHaveText('Not yet');

  await page.goto('/labs/trade-what-matters-less/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Start the first talk' }).click();
  await page.getByRole('button', { name: 'Walk away: 40 points' }).click();
  await expect(page.getByTestId('tr-status')).toContainText('No deal: you stay where you are, with 40 points');
  await page.getByRole('button', { name: 'Next talk' }).click();
  await page.getByRole('button', { name: /^Accept Rajan's offer: 25 points/ }).click();
  await expect(page.getByTestId('tr-you')).toHaveText('65');
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), DONE_KEY))
    .toContain('labs/trade-what-matters-less');

  await page.goto('/progress/');
  await hydrated(page);
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  await expect(when).toHaveText(today);
});
