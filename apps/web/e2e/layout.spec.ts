import { expect, test } from '@playwright/test';
import { deploy } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

test('body text and the footer span the width of their container', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  for (const selector of ['.lead', 'footer p']) {
    const widths = await page
      .locator(selector)
      .first()
      .evaluate((el) => {
        const parent = el.parentElement!;
        const style = getComputedStyle(parent);
        return {
          text: el.getBoundingClientRect().width,
          container: parent.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
        };
      });
    expect(widths.text, selector).toBeGreaterThanOrEqual(widths.container - 1);
  }
});

test('the skills page shows every track with its lessons, what is planned, and the games that train it', async ({
  page,
}) => {
  await page.goto('/skills/');
  await expect(page.getByText('Lessons for this skill come later.')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 2 })).toHaveCount(11);
  // Built lessons are links; planned ones say when they come.
  await expect(page.getByRole('link', { name: 'The blunder check' })).toBeVisible();
  await expect(page.getByText('Two birds, one stone')).toBeVisible();
  await expect(page.getByText('Stage 4', { exact: false }).first()).toBeVisible();
  await expect(page.locator('#weigh-odds').getByRole('link', { name: 'Outs and odds' })).toBeVisible();
});

test('the drills page names the coordinates drill as such', async ({ page }) => {
  await page.goto('/chess/drills/');
  await expect(page.getByRole('heading', { name: 'Coordinates: find the square' })).toBeVisible();
});
