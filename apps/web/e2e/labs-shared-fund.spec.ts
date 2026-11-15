import { expect, test } from '@playwright/test';
import { DONE_KEY } from '../src/lib/done-lessons';
import { deploy, hydrated, watchShifts } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

test('The shared fund: six months with only the total, six on the notice board with fines, then the debrief and the played record', async ({
  page,
}) => {
  await page.goto('/progress/');
  await hydrated(page);
  const when = page.getByTestId('lab-played-shared-fund').locator('dd');
  await expect(when).toHaveText('Not yet');

  const shifts = await watchShifts(page);
  await page.goto('/labs/shared-fund/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Start' }).click();
  const status = page.getByTestId('fund-status');
  const you = page.getByTestId('fund-you');
  const input = page.getByLabel('Points you put into the fund (you keep the rest)');
  const putIn = async (points: number) => {
    await expect(input).toBeFocused();
    await input.fill(String(points));
    await input.press('Enter');
  };
  const next = () => page.getByRole('button', { name: 'Next month' }).click();

  // Part 1: only the total is posted. Put in all 10 every month; the neighbours put in less.
  await expect(page.getByTestId('fund-head')).toHaveText('Only the total posted');
  await putIn(10);
  await expect(status).toBeFocused();
  await expect(status).toHaveText(
    'The fund got 32 points in all. Doubled and shared, that is 12.8 each. You kept 0 and end the month with 12.8.',
  );
  await expect(you).toHaveText('12.8');
  for (let month = 2; month <= 6; month++) {
    await next();
    await putIn(10);
  }
  await expect(you).toHaveText('63.6');
  await next();

  // Part 2: the notice board. Put in nothing and fine Rakesh; Anita and Lakshmi fine you.
  await expect(page.getByTestId('fund-head')).toHaveText('Part 2: the notice board');
  await expect(page.getByTestId('fund-head')).toBeFocused();
  await page.getByRole('button', { name: 'Start part 2' }).click();
  await putIn(0);
  const board = page.getByTestId('fund-notice');
  await expect(board).toBeFocused();
  await expect(board).toContainText('Rakesh put in 0');
  await expect(board).toContainText('Anita put in 8');
  await page.getByLabel('Fine Rakesh').check();
  await page.getByRole('button', { name: 'Post the fines' }).click();
  await expect(status).toBeFocused();
  await expect(status).toHaveText(
    'The fund got 22 points in all. Doubled and shared, that is 8.8 each. You kept 10, paid 1 for your fines, were fined by Anita and Lakshmi (6 points) and end the month with 11.8. Fined this month: Rakesh.',
  );
  for (let month = 8; month <= 12; month++) {
    await next();
    await expect(page.getByTestId('fund-month')).toContainText(String(month));
    await putIn(10);
    await page.getByRole('button', { name: 'Fine nobody' }).click();
  }
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), DONE_KEY)).toContain('labs/shared-fund');

  await page.getByRole('button', { name: 'See the debrief' }).click();
  const debrief = page.getByTestId('fund-debrief');
  await expect(debrief.getByRole('heading', { name: 'Debrief' })).toBeFocused();
  await expect(page.getByTestId('fund-plain').getByRole('row')).toHaveCount(7);
  await expect(page.getByTestId('fund-board').getByRole('row')).toHaveCount(7);
  await expect(page.getByTestId('fund-fall')).toContainText('22 points in month 1 and 15 in month 6');
  await expect(page.getByTestId('fund-fall')).toContainText(
    'Rakesh put in nothing and ended the part with 123.6 points, more than anyone else',
  );
  await expect(page.getByTestId('fund-hold')).toContainText(
    'You gave 1 fine, which cost you 1, and got 2, which cost you 6',
  );
  await expect(debrief).toContainText('each ends 6 months with 120 points; if nobody does, with 60');
  expect(await shifts()).toBeLessThan(0.1);
  await expect(page.locator('section.try .stage')).toHaveAttribute('data-steps', /life\/public-goods\//);
  await expect(page.locator('section.try .stage')).toHaveAttribute('data-steps', /"measures":"cooperate"/);

  await page.goto('/progress/');
  await hydrated(page);
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  await expect(when).toHaveText(today);
});
