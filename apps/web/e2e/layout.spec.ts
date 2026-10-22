import { expect, test, type Page } from '@playwright/test';
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

test.describe('on a notched phone', () => {
  /** Box edges of the header bar, the first line of content, the update banner's text and the footer's last line. */
  const edges = (page: Page) =>
    page.evaluate(() => {
      document.getElementById('update')!.hidden = false;
      const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
      const doc = document.documentElement;
      return {
        top: box('.site-header .bar').top,
        left: Math.min(box('main .wrap > *').left, box('.update span').left, box('.brand').left),
        right: doc.clientWidth - Math.max(box('main .wrap > *').right, box('.site-header nav').right),
        bottom: doc.scrollHeight - (box('.site-footer p:last-of-type').bottom + window.scrollY),
      };
    });
  const insets = (page: Page, insets: { top: number; bottom: number; left: number; right: number }) =>
    page
      .context()
      .newCDPSession(page)
      .then((cdp) => cdp.send('Emulation.setSafeAreaInsetsOverride', { insets }));

  test('keeps the header, content, update banner and footer clear of the notch and corners', async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto('/');
    const plain = await edges(page);
    await insets(page, { top: 47, bottom: 34, left: 0, right: 0 });
    const portrait = await edges(page);
    expect(portrait.top).toBeGreaterThanOrEqual(47);
    expect(portrait.bottom).toBeGreaterThanOrEqual(34);
    expect(portrait.left).toBe(plain.left);

    await page.setViewportSize({ width: 915, height: 412 });
    await insets(page, { top: 0, bottom: 21, left: 47, right: 47 });
    const landscape = await edges(page);
    expect(landscape.left).toBeGreaterThanOrEqual(47);
    expect(landscape.right).toBeGreaterThanOrEqual(47);
  });

  test('changes nothing where the screen has no notch', async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto('/');
    const plain = await edges(page);
    expect(plain.top).toBe(0);
    expect(plain.left).toBe(16);
    await insets(page, { top: 0, bottom: 0, left: 0, right: 0 });
    expect(await edges(page)).toEqual(plain);
  });
});
