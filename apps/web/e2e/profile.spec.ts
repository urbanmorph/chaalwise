import { expect, test, type Page } from '@playwright/test';
import { completeLesson, deploy, hydrated } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

test('a new learner is pointed at board sense, and every skill is not started', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('home-next-focus')).toContainText('Board sense');
  await page.goto('/progress/');
  await hydrated(page);
  await expect(page.locator('[data-skill] .label').first()).toHaveText('Not started');
  await expect(page.getByTestId('next-focus')).toContainText('Board sense');
});

test('finishing a lesson builds the profile from your own answers, and sets the next focus', async ({ page }) => {
  await completeLesson(page, 'hanging');
  await page.goto('/progress/');
  await hydrated(page);
  const safety = page.locator('[data-skill="safety"]');
  await expect(safety.locator('.label')).toHaveText('Noticing');
  await expect(safety).toContainText('You got 3 of your last 3 first time, over 1 day.');
  await expect(safety).toContainText('For Applying: at least 5 tries, and 6 in 10 first time.');
  await expect(page.getByTestId('next-focus')).toContainText('Safety (the blunder check)');

  await page.goto('/');
  const card = page.getByTestId('home-next-focus');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Safety (the blunder check)');
  await expect(card.getByRole('link')).toHaveAttribute('href', '/chess/drills/');
});

test('skills that need practice games say so instead of showing a level they cannot earn yet', async ({ page }) => {
  await page.goto('/progress/');
  await hydrated(page);
  await expect(page.locator('[data-skill="time"]')).toContainText('Measured in practice games, which come next.');
});

/** Sum the page's layout shifts (CLS); under 0.1 is good. */
async function watchShifts(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { shift: number }).shift = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
        if (!entry.hadRecentInput) (window as unknown as { shift: number }).shift += entry.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  return async () => {
    await page.waitForTimeout(500);
    return page.evaluate(() => (window as unknown as { shift: number }).shift);
  };
}

test('the progress page does not jump about as the profile loads', async ({ page }) => {
  await completeLesson(page, 'hanging');
  const shifts = await watchShifts(page);
  await page.goto('/progress/');
  await hydrated(page);
  await expect(page.locator('[data-skill="safety"] .label')).toHaveText('Noticing');
  expect(await shifts()).toBeLessThan(0.1);
});

test("the home page does not jump when a returning learner's next focus loads", async ({ page }) => {
  await completeLesson(page, 'hanging');
  const shifts = await watchShifts(page);
  await page.goto('/');
  await expect(page.getByTestId('home-next-focus')).toContainText('Safety (the blunder check)');
  expect(await shifts()).toBeLessThan(0.1);
});
