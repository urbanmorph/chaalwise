import { expect, test, type Page } from '@playwright/test';
import { DONE_KEY } from '../src/lib/done-lessons';
import { deploy, hydrated, watchShifts } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

/** The first number of the case on screen, as the lab set it. */
const anchor = async (page: Page) => (await page.getByTestId('fn-first').getAttribute('data-anchor'))!;

/**
 * Play both parts. In part 1 every estimate is the first number itself: all the
 * way towards it. In part 2 every estimate is `second`, or the first number again.
 */
async function playThrough(page: Page, second?: string) {
  await page.getByRole('button', { name: 'Start' }).click();
  const head = page.getByTestId('fn-round');
  await expect(head).toBeFocused();
  const estimate = page.locator('#fn-estimate');
  for (let i = 1; i <= 6; i++) {
    await expect(head).toHaveText(`Part 1: estimate ${i} of 6`);
    await page.getByRole('button', { name: 'Above' }).click();
    await expect(estimate).toBeFocused();
    await estimate.fill(await anchor(page));
    await estimate.press('Enter');
  }
  const status = page.getByTestId('fn-status');
  await expect(status).toBeFocused();
  await expect(status).toContainText('Part 1 is done');

  await page.getByRole('button', { name: 'Start part 2' }).click();
  for (let i = 1; i <= 6; i++) {
    await expect(head).toHaveText(`Part 2: estimate ${i} of 6`);
    await expect(head).toBeFocused();
    // The estimate cannot be sent without a reason each way.
    await estimate.fill(second ?? (await anchor(page)));
    await estimate.press('Enter');
    await expect(head).toHaveText(`Part 2: estimate ${i} of 6`);
    await page.getByLabel(/^One reason .+ could be too high$/).fill('The owner wants more');
    await page.getByLabel('One reason it could be too low').fill('The wheel means nothing');
    await estimate.press('Enter');
  }
  await expect(status).toBeFocused();
  await expect(status).toContainText('Done: twelve estimates');
}

test('First number wins?: six estimates after a first number, then six after a reason each way, then the debrief', async ({
  page,
}) => {
  const shifts = await watchShifts(page);
  await page.goto('/labs/first-number/');
  await hydrated(page);
  // Nothing typed in the lab leaves the page.
  const sent: string[] = [];
  page.on('request', (r) => {
    if (r.method() !== 'GET') sent.push(r.url());
  });
  await playThrough(page);
  await expect(page.getByTestId('fn-status')).toContainText(
    'Without reasons, you moved 100% of the way towards the first number. After a reason each way, you moved 100%',
  );

  await page.getByRole('button', { name: 'See the debrief' }).click();
  const debrief = page.getByTestId('fn-debrief');
  await expect(debrief.getByRole('heading', { name: 'Debrief' })).toBeFocused();
  await expect(debrief.getByRole('row')).toHaveCount(7);
  await expect(debrief.getByRole('row').filter({ hasText: 'high' })).toHaveCount(3);
  await expect(debrief.getByRole('row').filter({ hasText: 'low' })).toHaveCount(3);
  await expect(debrief).toContainText('Pune flat');
  await expect(debrief).toContainText('₹27,000');
  await expect(page.getByTestId('fn-summary')).toContainText('So the first numbers moved your answers');
  await expect(page.getByTestId('fn-change')).toContainText('The pull stayed about the same');
  await expect(debrief).toContainText('consider the opposite');
  expect(await shifts()).toBeLessThan(0.1);
  expect(sent).toEqual([]);
  await expect(page.locator('section.try .stage')).toHaveAttribute('data-steps', /life\/anchoring\//);
  await expect(page.locator('section.try .stage')).toHaveAttribute('data-steps', /"measures":"read-hidden"/);
});

test('First number wins?: playing to the end records the lab as played, and keeps no estimate', async ({ page }) => {
  await page.goto('/progress/');
  await hydrated(page);
  const when = page.getByTestId('lab-played-first-number').locator('dd');
  await expect(when).toHaveText('Not yet');

  await page.goto('/labs/first-number/');
  await hydrated(page);
  await playThrough(page, '7777');
  await expect(page.getByTestId('fn-debrief')).toHaveCount(0);
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), DONE_KEY)).toContain('labs/first-number');
  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  expect(stored).not.toContain('7777');
  expect(stored).not.toContain('The wheel means nothing');

  await page.goto('/progress/');
  await hydrated(page);
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  await expect(when).toHaveText(today);
});
