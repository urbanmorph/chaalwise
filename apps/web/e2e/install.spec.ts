import { devices, expect, test } from '@playwright/test';
import { deploy } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

test('Chrome finds the app installable, by a manifest with an id and a language', async ({ page }) => {
  await page.goto('/');
  const manifest = await (await page.request.get('/manifest.webmanifest')).json();
  expect(manifest).toMatchObject({ id: '/', lang: 'en' });
  const cdp = await page.context().newCDPSession(page);
  await expect.poll(async () => (await cdp.send('Page.getInstallabilityErrors')).installabilityErrors).toEqual([]);
});

test('screenshots for the install dialog load, with the type the manifest declares', async ({ page }) => {
  const { screenshots } = await (await page.request.get('/manifest.webmanifest')).json();
  expect(screenshots).toHaveLength(2);
  for (const { src, type } of screenshots) {
    const res = await page.request.get(src);
    expect(res.status(), src).toBe(200);
    expect(res.headers()['content-type'], src).toBe(type);
  }
});

test('the button is hidden until the browser offers an install, then prompts on tap', async ({ page }) => {
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Install app' });
  await expect(button).toBeHidden();

  await page.evaluate(() => {
    const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt: async () => {
        (window as unknown as { prompted: boolean }).prompted = true;
      },
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    });
    window.dispatchEvent(event);
  });
  await expect(button).toBeVisible();
  await button.click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { prompted?: boolean }).prompted)).toBe(true);
  await expect(button).toBeHidden();
});

test.describe('on iPhone Safari', () => {
  test.use({ userAgent: devices['iPhone 15'].userAgent });

  test('the button opens the Add to Home Screen guide', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Install app' }).click();
    const guide = page.getByRole('dialog', { name: 'Add Chaalwise to your Home Screen' });
    await expect(guide).toBeVisible();
    await expect(guide).toContainText('Add to Home Screen');
    await guide.getByRole('button', { name: 'OK' }).click();
    await expect(guide).toBeHidden();
  });
});
