import { expect, test } from '@playwright/test';
import { deploy } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

test('an old lesson address moves permanently to where the lesson lives now', async ({ page }) => {
  for (const old of ['/chess/check-and-mate/', '/chess/check-and-mate']) {
    const res = await page.request.get(old, { maxRedirects: 0 });
    expect(res.status(), old).toBe(301);
    expect(res.headers().location, old).toBe('/chess/mate-stalemate/');
  }
  await page.goto('/chess/pieces/?from=bookmark');
  await expect(page).toHaveURL(/\/chess\/rook-bishop\/\?from=bookmark$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Rook and bishop' })).toBeVisible();
});

test('the old credits page goes to the credits file', async ({ page }) => {
  const res = await page.request.get('/credits/', { maxRedirects: 0 });
  expect(res.status()).toBe(301);
  expect(res.headers().location).toBe('https://github.com/urbanmorph/chaalwise/blob/main/CREDITS.md');
});
