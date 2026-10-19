import { expect, test } from '@playwright/test';
import { completeLesson, deploy, hydrated } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

test('a new learner has no next focus on the home page, and every skill not started', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('home-next-focus')).toBeHidden();
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
