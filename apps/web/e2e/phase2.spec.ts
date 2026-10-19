import { expect, test, type Page } from '@playwright/test';
import { deploy, hydrated } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

/** Click a square on a board seen from White's side, positioned relative to the board itself. */
async function clickSquare(page: Page, square: string) {
  const board = page.locator('cg-board').first();
  const { width, height } = (await board.boundingBox())!;
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]) - 1;
  await board.click({ position: { x: ((file + 0.5) * width) / 8, y: ((7.5 - rank) * height) / 8 } });
}

test('a square step takes a click on the board or a typed square', async ({ page }) => {
  await page.goto('/chess/coordinates/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Continue' }).click();
  await clickSquare(page, 'd4');
  await expect(page.getByText('e4 is 1 file to the right of d4. Try again.')).toBeVisible();
  await clickSquare(page, 'e4');
  await expect(page.getByText('You found it!')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Or type the square').fill('d5');
  await page.getByRole('button', { name: 'Pick' }).click();
  await expect(page.getByText('You found it!')).toBeVisible();
});

test('the coordinates drill counts finds for thirty seconds and keeps the best score', async ({ page }) => {
  // Fake timers, but running: the board draws on animation frames. Then jump the thirty seconds.
  await page.clock.install();
  await page.clock.resume();
  await page.goto('/chess/drills/');
  await hydrated(page);
  const drill = page.locator('section', { hasText: 'Find the square' });
  await drill.getByRole('button', { name: 'Start' }).click();
  for (let found = 1; found <= 3; found++) {
    const target = (await drill.locator('.target').textContent())!.trim();
    await clickSquare(page, target);
    await expect(drill.getByText(`${found} found`)).toBeVisible();
  }
  await page.clock.fastForward(31_000);
  await expect(drill.getByText('You found 3 in 30 seconds.')).toBeVisible();
  await expect(drill.getByText(/Best 3 · last 3\s·\sdone today/)).toBeVisible();
});

test('the safety drill asks ten moves and keeps the score', async ({ page }) => {
  await page.goto('/chess/drills/');
  await hydrated(page);
  const drill = page.locator('section', { hasText: 'Is this move safe?' });
  await drill.getByRole('button', { name: 'Start' }).click();
  for (let i = 0; i < 10; i++) {
    await expect(drill.getByRole('heading', { level: 3, name: /^Is .+ safe\?$/ })).toBeVisible();
    await drill.getByRole('button', { name: 'Safe', exact: true }).click();
    await expect(drill.getByText(/^(Right|Not quite)\./)).toBeVisible();
    await drill.getByRole('button', { name: /^(Next|Finish)$/ }).click();
  }
  await expect(drill.getByText(/You judged \d+ of 10 moves correctly\./)).toBeVisible();
  await expect(drill.getByText(/Best \d+ · last \d+\s·\sdone today/)).toBeVisible();
});

test('a play-out against the lone king: a blunder, a nudge, a retry, then the idea', async ({ page }) => {
  await page.goto('/chess/queen-mate/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('20 moves left')).toBeVisible();

  const blunder = async () => {
    // Qf5+ puts the queen next to the king with nothing guarding it.
    await page.getByLabel('Or type your move').fill('Qf5');
    await page.getByRole('button', { name: 'Play' }).click();
    await expect(page.getByText('Their king took your piece, and a king alone cannot mate.')).toBeVisible();
    await expect(page.getByText('Your queen on f5 can be taken for free.', { exact: false })).toBeVisible();
  };

  await blunder();
  await expect(page.getByText('Not this time. Try again.')).toBeVisible();
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByText('20 moves left')).toBeVisible();

  await blunder();
  await expect(page.getByText('Box, shrink, bring the king, mate.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue' })).toBeFocused();
});

test('a play-out can be played from the keyboard: focus stays put and the reply is read out', async ({ page }) => {
  await page.goto('/chess/queen-mate/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Continue' }).click();
  const input = page.getByLabel('Or type your move');
  await input.fill('Qf3');
  await input.press('Enter');
  await expect(page.getByText(/Their king went to [a-h][1-8]\. 19 moves left/)).toBeVisible();
  await expect(input).toBeFocused();
});

test('square steps hide the coordinates, which would give the answer away', async ({ page }) => {
  await page.goto('/chess/coordinates/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Find e4.')).toBeVisible();
  await expect(page.locator('coords')).toHaveCount(0);
});

test('starting the coordinates drill puts the keyboard in the typed-square field', async ({ page }) => {
  await page.goto('/chess/drills/');
  await hydrated(page);
  await page.locator('section', { hasText: 'Find the square' }).getByRole('button', { name: 'Start' }).click();
  await expect(page.getByLabel('Or type the square')).toBeFocused();
});
