import { expect, test } from '@playwright/test';
import { DONE_KEY } from '../src/lib/done-lessons';
import { deploy, hydrated, watchShifts } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

test('Follow the queue?: a queue that locks on the wrong door, asking why, then the debrief and the "played" record', async ({
  page,
}) => {
  await page.goto('/progress/');
  await hydrated(page);
  const when = page.getByTestId('lab-played-follow-the-queue').locator('dd');
  await expect(when).toHaveText('Not yet');

  const shifts = await watchShifts(page);
  await page.goto('/labs/follow-the-queue/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Go to the first street' }).click();
  const head = page.getByTestId('fq-head');
  const status = page.getByTestId('fq-status');
  const queue = page.getByTestId('fq-queue').getByRole('listitem');
  const tip = page.getByTestId('fq-tip');
  const next = () => page.getByRole('button', { name: 'Next street' }).click();
  const doorOf = async (i: number) => (await queue.nth(i).locator('strong').textContent())!;
  await expect(head).toBeFocused();
  await expect(head).toContainText('Read the queue');

  for (let street = 1; street <= 6; street++) {
    if (street > 1) await next();
    await expect(page.getByTestId('fq-street')).toContainText(`${street} of 6`);
    await expect(queue).toHaveCount(5);
    const mine = (await tip.textContent())!;
    const first = await doorOf(0);
    if (street === 2 || street === 5) {
      // Picked to start wrong: the first two went the wrong way, everyone followed, and your tip says the other door.
      for (let i = 1; i < 5; i++) expect(await doorOf(i)).toBe(first);
      expect(mine).not.toBe(first);
    }
    if (street >= 4) {
      await expect(head).toContainText('Ask why');
      await page.getByRole('button', { name: 'Ask the queue why' }).click();
      await expect(queue.first()).toContainText('“');
      if (street === 5) {
        await expect(queue.nth(0)).toContainText(`My friend’s tip said ${first}.`);
        await expect(queue.nth(2)).toContainText(`The queue for ${first} was longer.`);
      }
      await page.getByRole('button', { name: 'Ask 4 friends' }).click();
      await expect(page.getByTestId('fq-friends')).toContainText('Your 4 friends who have not seen the queue say:');
    } else {
      await expect(page.getByRole('button', { name: 'Ask the queue why' })).toHaveCount(0);
    }
    await page.getByRole('button', { name: `Go to ${mine}` }).click();
    await expect(status).toBeFocused();
    await expect(status).toContainText(`You went to ${mine}`);
    await expect(page.getByTestId('fq-reveal').getByRole('row')).toHaveCount(13);
    if (street === 2 || street === 5) {
      // Your tip was right on these streets.
      await expect(status).toContainText(`${mine} was better. You went to ${mine}: +10 points.`);
      await expect(page.getByText('This street was picked to start wrong')).toBeVisible();
      await expect(page.getByText(`From person 3, the queue was locked on ${first}`)).toBeVisible();
    }
  }
  // Played to the end: met, and its questions open up in practice.
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), DONE_KEY))
    .toContain('labs/follow-the-queue');

  await page.getByRole('button', { name: 'See the debrief' }).click();
  const debrief = page.getByTestId('fq-debrief');
  await expect(debrief.getByRole('heading', { name: 'Debrief' })).toBeFocused();
  await expect(debrief.getByRole('table').first().getByRole('row')).toHaveCount(7);
  await expect(page.getByTestId('fq-tally')).toContainText(
    'of the 66 other people had a tip for the better restaurant',
  );
  await expect(page.getByTestId('fq-sim').getByRole('row')).toHaveCount(6);
  await expect(page.getByTestId('fq-sim')).toContainText('20%');
  await expect(debrief).toContainText('This is an information cascade.');
  await expect(debrief.getByRole('link', { name: 'the Ask the panel lab' })).toHaveAttribute(
    'href',
    '/labs/ask-the-panel/',
  );
  expect(await shifts()).toBeLessThan(0.1);
  await expect(page.locator('section.try .stage')).toHaveAttribute('data-steps', /"measures":"read-hidden"/);

  await page.goto('/progress/');
  await hydrated(page);
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  await expect(when).toHaveText(today);
});
