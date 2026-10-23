import { expect, test } from '@playwright/test';
import { deploy, hydrated } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

test.describe('a reader in India', () => {
  test.use({ locale: 'en-IN' });

  test('sees amounts as written, in lakh', async ({ page }) => {
    await page.goto('/cases/rushed-website/');
    await hydrated(page);
    await expect(page.getByText('a bonus of ₹1 lakh if you make it', { exact: false })).toBeVisible();
    await page.goto('/');
    await expect(page.locator('.amount')).toHaveText('₹40 lakh');
  });
});

test.describe('a reader elsewhere', () => {
  test.use({ locale: 'en-US' });

  test('sees the same rupees as plain numbers, and is told they are rupees', async ({ page }) => {
    await page.goto('/cases/rushed-website/');
    await hydrated(page);
    await expect(page.getByTestId('currency')).toContainText('Indian rupees');
    await expect(page.getByText('a bonus of ₹100,000 if you make it', { exact: false })).toBeVisible();
    await page.goto('/');
    await expect(page.locator('.amount')).toHaveText('₹4,000,000');
  });
});
