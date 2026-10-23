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

test('the coordinates lesson walks through files and ranks, with a hint for a wrong square', async ({ page }) => {
  await page.goto('/chess/coordinates/');
  await hydrated(page);
  // A file is shown, then the learner picks a square on it.
  await expect(page.locator('cg-board square.area')).toHaveCount(8);
  await page.getByRole('button', { name: 'Continue' }).click();
  await clickSquare(page, 'd3');
  await expect(page.getByText('d3 is on the d-file. Look for the e-file. Try again.')).toBeVisible();
  await clickSquare(page, 'e6');
  await expect(page.getByText('You found it.')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  // Then a rank, picked by typing this time.
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Or type the square').fill('c4');
  await page.getByRole('button', { name: 'Pick' }).click();
  await expect(page.getByText('You found it.')).toBeVisible();
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
  await expect(
    page.getByText('Box the king in, shrink the box, bring your king up, then mate.', { exact: false }),
  ).toBeVisible();
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

test('coordinates show while names are taught, and hide once the learner finds squares alone', async ({ page }) => {
  await page.goto('/chess/coordinates/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Pick any square on the e-file (the column marked e).')).toBeVisible();
  await expect(page.locator('coords')).toHaveCount(2);
  const answer = async (square: string) => {
    await page.getByLabel('Or type the square').fill(square);
    await page.getByRole('button', { name: 'Pick' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
  };
  await answer('e2');
  await page.getByRole('button', { name: 'Continue' }).click();
  await answer('a4');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(
    page.getByText('Pick the square e4. The letters and numbers on the edges are hidden now.'),
  ).toBeVisible();
  await expect(page.locator('coords')).toHaveCount(0);
});

test('starting the coordinates drill puts the keyboard in the typed-square field', async ({ page }) => {
  await page.goto('/chess/drills/');
  await hydrated(page);
  await page.locator('section', { hasText: 'Find the square' }).getByRole('button', { name: 'Start' }).click();
  await expect(page.getByLabel('Or type the square')).toBeFocused();
});

test('once a choice is answered, the board highlights the square it was about', async ({ page }) => {
  await page.goto('/chess/board/');
  await hydrated(page);
  // Past the six steps that meet the pieces, which light up where each one stands.
  for (let i = 0; i < 6; i++) await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('cg-board square.highlight')).toHaveCount(0);
  await page.getByRole('button', { name: 'h1, a light square' }).click();
  // On a board seen from White, h1 is the bottom-right square.
  const square = page.locator('cg-board square.highlight');
  await expect(square).toHaveCount(1);
  const board = (await page.locator('cg-board').boundingBox())!;
  const box = (await square.boundingBox())!;
  expect(Math.round(box.x - board.x)).toBe(Math.round((board.width * 7) / 8));
  expect(Math.round(box.y - board.y)).toBe(Math.round((board.height * 7) / 8));
});

test("an answer can show arrows, and a knight's arrow turns the corner", async ({ page }) => {
  await page.goto('/chess/blunder-check/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('svg.arrows polyline')).toHaveCount(0);
  await page.getByRole('button', { name: 'Your queen' }).click();
  const arrow = page.locator('svg.arrows polyline');
  await expect(arrow).toHaveCount(1);
  // c3 to d1: start, corner, end.
  expect((await arrow.getAttribute('points'))!.split(' ')).toHaveLength(3);
});

test('every coordinate label sits wholly inside the board, so none is cut off', async ({ page }) => {
  await page.goto('/chess/board/');
  await hydrated(page);
  const board = (await page.locator('.board').boundingBox())!;
  const labels = page.locator('coords coord');
  await expect(labels).toHaveCount(16);
  for (const box of await labels.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON()))) {
    expect(box.top).toBeGreaterThanOrEqual(board.y);
    expect(box.bottom).toBeLessThanOrEqual(board.y + board.height);
    expect(box.left).toBeGreaterThanOrEqual(board.x);
    expect(box.right).toBeLessThanOrEqual(board.x + board.width);
  }
  await expect(page.locator('coords.files coord').first()).toHaveText('a');
});

test('clicking a piece picks that piece, even after something above the board pushes it down', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto('/chess/board/');
  await hydrated(page);
  for (const name of [...Array(6).fill('Continue'), 'h1, a light square', 'Continue', 'd1', 'Continue'])
    await page.getByRole('button', { name, exact: true }).click();
  // Safari has no scroll anchoring, so content appearing above the board moves it without any scroll event.
  await page.evaluate(() => {
    document.documentElement.style.overflowAnchor = 'none';
    // Scrolled, with the board just below the top of the screen.
    window.scrollTo(0, document.querySelector('cg-board')!.getBoundingClientRect().top + window.scrollY - 120);
  });
  const tap = async (square: string) => {
    const box = (await page.locator('cg-board').boundingBox())!;
    await page.mouse.click(
      box.x + ((square.charCodeAt(0) - 96.5) * box.width) / 8,
      box.y + ((8.5 - Number(square[1])) * box.height) / 8,
    );
  };
  await tap('e2');
  await tap('e2'); // the board has now worked out where it is
  // Something appears above the board, as the "update ready" banner does.
  await page.evaluate(() =>
    document
      .querySelector('main')!
      .insertAdjacentHTML('afterbegin', '<div style="height:60px">A new version is ready.</div>'),
  );
  await tap('e2');
  await tap('e4');
  await expect(page.getByText('You found it.')).toBeVisible();
});
