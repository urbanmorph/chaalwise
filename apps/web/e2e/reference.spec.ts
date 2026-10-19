import { expect, test } from '@playwright/test';
import { deploy } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

test('search finds an entry by another name, ignoring accents, and the game filter narrows it', async ({ page }) => {
  await page.goto('/reference/');
  const search = page.getByRole('searchbox', { name: 'Search the reference' });
  await search.fill('kid');
  await expect(page.getByRole('link', { name: "King's Indian Defence" })).toBeVisible();
  await expect(page.getByText('1 result', { exact: true })).toBeVisible();

  await search.fill('grunfeld');
  await expect(page.getByRole('link', { name: 'Grünfeld Defence' })).toBeVisible();

  // The search is in the address, so it can be shared and survives a reload.
  await search.fill('odds');
  await page.getByRole('radio', { name: 'Poker' }).check({ force: true });
  await expect(page).toHaveURL(/\?q=odds&game=poker$/);
  await page.reload();
  await expect(search).toHaveValue('odds');
  await expect(page.getByRole('link', { name: 'Pot odds' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Strategy', level: 2 })).toBeHidden();

  await search.fill('xyzzy');
  await expect(page.getByText('Nothing matches that.')).toBeVisible();
});

test('an opening entry shows its moves on a board, and links to the lesson and related entries', async ({ page }) => {
  await page.goto('/reference/chess/italian-game/');
  await expect(page.getByRole('heading', { level: 1, name: 'Italian Game' })).toBeVisible();
  await expect(page.getByText('1.e4 e5 2.Nf3 Nc6 3.Bc4', { exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: /Italian Game: a chess diagram after 1\.e4/ })).toBeVisible();
  await page.getByRole('link', { name: 'Ruy Lopez' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Ruy Lopez' })).toBeVisible();
});

test('a strategy entry says why it matters and where it shows up away from the game', async ({ page }) => {
  await page.goto('/reference/strategy/sunk-cost/');
  await expect(page.getByRole('heading', { name: 'Why it matters' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Away from the game' })).toBeVisible();
});

test('a lesson links to the reference entries it teaches', async ({ page }) => {
  await page.goto('/chess/back-rank/');
  await page
    .getByRole('navigation', { name: 'In the reference' })
    .getByRole('link', { name: 'Back-rank mate' })
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Back-rank mate' })).toBeVisible();
});

test('every header link fits on a phone screen', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/reference/');
  for (const link of await page.getByRole('navigation', { name: 'Main' }).getByRole('link').all()) {
    const box = (await link.boundingBox())!;
    expect(box.x + box.width, (await link.textContent()) ?? '').toBeLessThanOrEqual(360);
  }
});

test('the reference also finds interactive lessons and practice drills, and filters by type', async ({ page }) => {
  await page.goto('/reference/?q=square');
  await expect(page.getByRole('link', { name: 'Name the squares' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Coordinates: find the square' })).toBeVisible();
  await page.getByRole('radio', { name: 'Practice' }).check({ force: true });
  await expect(page.getByRole('link', { name: 'Name the squares' })).toBeHidden();
  await page.getByRole('link', { name: 'Coordinates: find the square' }).click();
  await expect(page).toHaveURL(/\/chess\/drills\/#find-the-square$/);
  await expect(page.getByRole('heading', { name: 'Coordinates: find the square' })).toBeInViewport();
});
