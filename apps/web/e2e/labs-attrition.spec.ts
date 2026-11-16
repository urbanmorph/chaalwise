import { expect, test, type Page } from '@playwright/test';
import { DONE_KEY } from '../src/lib/done-lessons';
import { deploy, hydrated, watchShifts } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

/** Stays in week after week until the contest is settled; the neighbours' stop points are drawn at random. */
async function stayUntilSettled(page: Page) {
  const stay = page.getByRole('button', { name: 'Stay in', exact: true });
  for (let week = 1; await stay.isVisible(); week++) {
    await stay.click();
    await expect(page.getByTestId('wo-status')).toContainText(`Week ${week}:`);
  }
}

test('Wait them out?: a stop point and a contest against each of four neighbours, then the debrief and the played record', async ({
  page,
}) => {
  await page.goto('/progress/');
  await hydrated(page);
  const when = page.getByTestId('lab-played-wait-them-out').locator('dd');
  await expect(when).toHaveText('Not yet');

  const shifts = await watchShifts(page);
  await page.goto('/labs/wait-them-out/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Start' }).click();
  const head = page.getByTestId('wo-head');
  const status = page.getByTestId('wo-status');
  const plan = (name: string) => page.getByRole('button', { name, exact: true }).click();

  // Bina has few evenings free: she withdraws within three weeks, so staying in wins.
  await expect(head).toBeFocused();
  await expect(head).toContainText('Against Bina');
  await expect(page.getByRole('button', { name: 'Stay in' })).toHaveCount(0);
  await plan('5 weeks');
  await expect(status).toHaveText('Your stop point: at most 5 weeks in.');
  await stayUntilSettled(page);
  await expect(status).toContainText('Bina withdrew, and the post is yours.');
  await page.getByRole('button', { name: 'Next: Arjun' }).click();

  // Arjun's loud words cost him nothing: staying in past a stop point of 2 weeks wins.
  await expect(head).toContainText('Against Arjun');
  await plan('2 weeks');
  await stayUntilSettled(page);
  await expect(status).toContainText('Arjun withdrew, and the post is yours.');
  await page.getByRole('button', { name: 'Next: Farah' }).click();

  // Farah paid up front: withdraw at once, for 0.
  await plan('Withdraw at once');
  await page.getByRole('button', { name: 'Withdraw', exact: true }).click();
  await expect(status).toHaveText(
    /^Week 1: you withdrew, and Farah takes the post\. You paid for 0 weeks: 0 points\. Farah would have stayed in for (1[5-9]|20) weeks\.$/,
  );
  await page.getByRole('button', { name: 'Next: Kavya' }).click();

  await plan('Withdraw at once');
  await page.getByRole('button', { name: 'Withdraw', exact: true }).click();
  await expect(status).toContainText('Kavya would have stayed in');
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), DONE_KEY)).toContain('labs/wait-them-out');

  await page.getByRole('button', { name: 'See the debrief' }).click();
  const debrief = page.getByTestId('wo-debrief');
  await expect(debrief.getByRole('heading', { name: 'Debrief' })).toBeFocused();
  await expect(page.getByTestId('wo-rivals').getByRole('row')).toHaveCount(5);
  await expect(page.getByTestId('wo-kept')).toContainText('You stayed in past your stop point against Arjun.');
  await expect(page.getByTestId('wo-balance').getByRole('row')).toHaveCount(6);
  await expect(page.getByTestId('wo-balance')).not.toContainText('−');
  await expect(page.getByTestId('wo-pair')).toContainText('4.8 weeks');
  await expect(page.getByTestId('wo-pair')).toContainText('32%');
  await expect(page.getByTestId('wo-pair')).toContainText('12%');
  await expect(debrief.getByRole('link', { name: 'Know when to stop' })).toHaveAttribute(
    'href',
    '/skills/know-when-to-stop/',
  );
  await expect(debrief.getByRole('link', { name: 'the Who backs down? lab' })).toHaveAttribute(
    'href',
    '/labs/who-backs-down/',
  );
  expect(await shifts()).toBeLessThan(0.1);
  await expect(page.locator('section.try .stage')).toHaveAttribute('data-steps', /life\/war-of-attrition\//);
  await expect(page.locator('section.try .stage')).toHaveAttribute('data-steps', /"measures":"composure"/);
  // The lesson on stop points is listed on the lab's page.
  await expect(page.locator('section.lessons').getByRole('link', { name: 'Know when to stop' })).toBeVisible();

  await page.goto('/progress/');
  await hydrated(page);
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  await expect(when).toHaveText(today);
});
