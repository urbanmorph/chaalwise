import { expect, test } from '@playwright/test';
import { deploy, hydrated } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

test('the step dots jump to any step and mark the ones done', async ({ page }) => {
  await page.goto('/chess/rook-bishop/');
  await hydrated(page);
  const dots = page.getByRole('navigation', { name: 'Steps in this lesson' }).getByRole('button');
  await expect(dots).toHaveCount(6);
  await dots.nth(4).click();
  await expect(page.getByRole('heading', { name: /bishop starts on a dark square/ })).toBeVisible();
  await page.getByRole('button', { name: 'No, it stays on dark squares all game' }).click();
  await expect(dots.nth(4)).toHaveAccessibleName('Step 5, done');
  await dots.nth(0).click();
  await expect(page.getByRole('heading', { name: /rook moves in straight lines/ })).toBeVisible();
  await expect(dots.nth(0)).toHaveAttribute('aria-current', 'step');
});

test('strategy lessons sit on the path, right after the chess lesson they build on', async ({ page }) => {
  await page.goto('/chess/');
  const items = page.locator('[data-lesson]');
  const ids = await items.evaluateAll((els) => els.map((el) => (el as HTMLElement).dataset.lesson));
  const at = ids.indexOf('chess/blunder-check');
  expect(ids.slice(at, at + 3)).toEqual(['chess/blunder-check', 'strategy/blunder-check', 'strategy/their-next-move']);
  await expect(page.getByText('Strategy · Think ahead').first()).toBeVisible();

  await page.goto('/skills/');
  await expect(page.getByRole('link', { name: 'The blunder check' })).toHaveAttribute('href', '/skills/blunder-check/');
});

test('a strategy lesson plays like any other, then leads on along the path', async ({ page }) => {
  await page.goto('/skills/blunder-check/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: /Ask how they could respond/ }).click();
  await expect(page.getByText('You found it!')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: /The price after the first year/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Finish' }).click();
  await expect(page.getByTestId('lesson-done')).toContainText('Saved on this device');
  await expect(page.getByRole('link', { name: 'Next: Their next move' })).toHaveAttribute(
    'href',
    '/skills/their-next-move/',
  );
});

test('a lesson that builds on unfinished stages says so, and offers the first one, without locking', async ({
  page,
}) => {
  await page.goto('/chess/back-rank/');
  await hydrated(page);
  const note = page.getByText('This builds on earlier lessons you have not done yet.');
  await expect(note).toBeVisible();
  await expect(page.getByRole('link', { name: 'Name the squares' })).toHaveAttribute('href', '/chess/coordinates/');
  // Still open: the first step can be played.
  await expect(page.getByRole('navigation', { name: 'Steps in this lesson' })).toBeVisible();
});
