import { expect, test, type Page } from '@playwright/test';
import { DONE_KEY } from '../src/lib/done-lessons';
import { deploy, hydrated, watchShifts } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

/** Win all five games by always leaving the bot a multiple of 4, checking the look back after each. */
async function winAll(page: Page) {
  const pile = async () => Number(await page.getByTestId('nim-pile').textContent());
  const status = page.getByTestId('nim-status');

  for (let game = 1; game <= 5; game++) {
    await expect(status).toContainText(`Game ${game}: the pile has`);
    // From a multiple of 4 the player to move loses, so let the bot start.
    const start = await pile();
    await page.getByRole('button', { name: start % 4 ? 'You go first' : 'Bot goes first' }).click();
    await expect(page.getByRole('button', { name: 'Take 1' })).toBeFocused();
    while (await page.getByRole('button', { name: 'Take 1' }).isVisible()) {
      const left = await pile();
      expect(left % 4, 'the bot always faces a multiple of 4').not.toBe(0);
      await page.getByRole('button', { name: `Take ${left % 4}` }).click();
    }
    await expect(status).toContainText(`you win game ${game}`);
    await expect(status).toBeFocused();
    await expect(page.getByTestId('nim-you')).toHaveText(String(game));
    const review = page.getByTestId('nim-review');
    await expect(review).toContainText('Positions to leave the bot: 4, 8, 12, 16, 20');
    await expect(review).toContainText('a multiple of 4.');
    await expect(review).not.toContainText('would have left');
    if (game < 5) await page.getByRole('button', { name: 'Next game' }).click();
  }
}

test('Nim: leave multiples of 4 to win all five games, looking back after each, then the debrief', async ({ page }) => {
  const shifts = await watchShifts(page);
  await page.goto('/labs/nim/');
  await hydrated(page);
  await winAll(page);

  await page.getByRole('button', { name: 'See the debrief' }).click();
  const debrief = page.getByTestId('nim-debrief');
  await expect(debrief.getByRole('heading', { name: 'Debrief' })).toBeFocused();
  await expect(debrief.getByRole('row')).toHaveCount(6);
  await expect(debrief).toContainText('You won 5 of 5');
  await expect(debrief).toContainText('backward induction');
  expect(await shifts()).toBeLessThan(0.1);
  await expect(page.locator('section.try .stage')).toHaveAttribute(
    'data-steps',
    /reference\/labs\/backward-induction\//,
  );
  await expect(page.locator('section.try .stage')).toHaveAttribute('data-steps', /"measures":"calculate"/);
});

test('Nim: taking turns starts the next game at once, with the bot first', async ({ page }) => {
  await page.goto('/labs/nim/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Take turns, you first' }).click();
  const take1 = page.getByRole('button', { name: 'Take 1' });
  while (await take1.isVisible()) await take1.click();
  const review = page.getByTestId('nim-review');
  await expect(review).toBeVisible();
  await page.getByRole('button', { name: 'Next game' }).click();
  // The second game starts at once, with the bot first.
  await expect(take1).toBeFocused();
  await expect(page.getByRole('list', { name: 'Moves this game' }).getByRole('listitem').first()).toContainText(
    'Bot took',
  );
});

test('Nim: playing the five games records the lab as played, with the date, even without the debrief', async ({
  page,
}) => {
  await page.goto('/progress/');
  await hydrated(page);
  const when = page.getByTestId('lab-played-nim').locator('dd');
  await expect(when).toHaveText('Not yet');

  await page.goto('/labs/nim/');
  await hydrated(page);
  await winAll(page);
  await expect(page.getByTestId('nim-debrief')).toHaveCount(0);
  // Met: its questions now open up in practice.
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), DONE_KEY)).toContain('labs/nim');

  await page.goto('/progress/');
  await hydrated(page);
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  await expect(when).toHaveText(today);
  // A lab is not a lesson.
  await expect(page.getByTestId('lessons-finished')).toHaveText('0');
});
