import { expect, test } from '@playwright/test';
import { DONE_KEY } from '../src/lib/done-lessons';
import { deploy, hydrated, watchShifts } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

test('Guess two-thirds: four crowds, each result worked out from the twelve numbers, then the debrief and the "played" record', async ({
  page,
}) => {
  await page.goto('/progress/');
  await hydrated(page);
  const when = page.getByTestId('lab-played-guess-two-thirds').locator('dd');
  await expect(when).toHaveText('Not yet');

  const shifts = await watchShifts(page);
  await page.goto('/labs/guess-two-thirds/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Start the first round' }).click();
  const head = page.getByTestId('tt-head');
  const status = page.getByTestId('tt-status');
  const input = page.getByLabel('Your number, from 0 to 100');
  await expect(head).toBeFocused();
  await expect(head).toContainText('A college fest crowd');

  const crowds = ['A college fest crowd', 'The same crowd, again', 'Newspaper readers', 'A game theory class'];
  const guesses = [22, 15, 22, 9];
  for (const [i, guess] of guesses.entries()) {
    if (i > 0) await page.getByRole('button', { name: 'Next round' }).click();
    await expect(head).toContainText(crowds[i]!);
    await expect(page.getByTestId('tt-round')).toContainText(`${i + 1} of 4`);
    await input.fill(String(guess));
    await page.getByRole('button', { name: 'Pick it' }).click();
    await expect(status).toBeFocused();
    // The target in the status is two-thirds of the average of the bots' numbers and yours.
    const note = await page.getByText(/^Dots: the bots’ numbers/).textContent();
    const bots = note!.split('The bots picked ')[1]!.replace('.', '').split(', ').map(Number);
    expect(bots).toHaveLength(11);
    const average = [...bots, guess].reduce((s, n) => s + n, 0) / 12;
    const one = (x: number) => x.toFixed(1).replace(/\.0$/, '');
    await expect(status).toContainText(
      `The average was ${one(average)}, so the target, two-thirds of it, was ${one((2 / 3) * average)}.`,
    );
    await expect(page.getByTestId('tt-line')).toBeVisible();
  }
  // Played to the end: met, and its questions open up in practice.
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), DONE_KEY))
    .toContain('labs/guess-two-thirds');

  await page.getByRole('button', { name: 'See the debrief' }).click();
  const debrief = page.getByTestId('tt-debrief');
  await expect(debrief.getByRole('heading', { name: 'Debrief' })).toBeFocused();
  await expect(debrief.getByRole('table').first().getByRole('row')).toHaveCount(5);
  await expect(page.getByTestId('tt-chain')).toContainText('two-thirds of the average would be 67');
  await expect(page.getByTestId('tt-chain')).toContainText('44, then 30, then 20, then 13');
  await expect(page.getByTestId('tt-depths').getByRole('row')).toHaveCount(6);
  await expect(page.getByTestId('tt-best')).toContainText('was closest on average');
  const replays = page.getByTestId('tt-replays');
  await expect(replays.getByRole('row')).toHaveCount(5);
  await expect(replays.getByRole('row', { name: /A college fest crowd/ })).toContainText('2 steps (22)');
  await expect(replays.getByRole('row', { name: /A game theory class/ })).toContainText('3 steps (15)');
  expect(await shifts()).toBeLessThan(0.1);
  await expect(page.locator('section.try .stage')).toHaveAttribute('data-steps', /"measures":"think-ahead"/);

  await page.goto('/progress/');
  await hydrated(page);
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  await expect(when).toHaveText(today);
});
