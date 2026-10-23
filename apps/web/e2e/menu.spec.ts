import { expect, test } from '@playwright/test';
import { deploy } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

const LINKS = ['strategy', 'chess', 'poker', 'daily', 'review', 'progress'];

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('the menu folds behind a Menu button, opens to every link, and closes with Escape', async ({ page }) => {
    await page.goto('/chess/');
    const nav = page.getByRole('navigation', { name: 'Main' });
    const toggle = page.getByRole('button', { name: 'Menu' });
    // The nav is a popover the button opens: the browser tells screen readers whether it is open.
    const open = () => nav.getByRole('link', { name: 'strategy' });
    await expect(toggle).toBeVisible();
    await expect(nav.getByRole('link', { name: 'strategy' })).toBeHidden();

    await toggle.click();
    await expect(open()).toBeVisible();
    for (const name of LINKS) await expect(nav.getByRole('link', { name, exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'chess', exact: true })).toHaveAttribute('aria-current', 'page');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);

    await page.keyboard.press('Escape');
    await expect(open()).toBeHidden();
    await expect(toggle).toBeFocused();
    await expect(nav.getByRole('link', { name: 'strategy' })).toBeHidden();

    await toggle.click();
    await nav.getByRole('link', { name: 'poker', exact: true }).click();
    await expect(page).toHaveURL(/\/poker\/$/);
    await expect(open()).toBeHidden();
  });

  test('offers Install app inside the menu when the browser can install', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() =>
      window.dispatchEvent(
        Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
          prompt: async () => {},
          userChoice: Promise.resolve({ outcome: 'dismissed' }),
        }),
      ),
    );
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(
      page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'Install app' }),
    ).toBeVisible();
  });

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });

    test('still opens, as the browser does it, not a script', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'Menu' }).click();
      for (const name of LINKS)
        await expect(
          page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name, exact: true }),
        ).toBeVisible();
    });
  });
});

test('on a wide screen the links sit in the bar, with Install app beside them and no Menu button', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Main' });
  for (const name of LINKS) await expect(nav.getByRole('link', { name, exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Menu' })).toBeHidden();
  // Hidden until the browser offers an install, so found by id, not by role.
  await expect(nav.locator('#install-app')).toBeAttached();
  await expect(page.locator('footer #install-app')).toHaveCount(0);
});
