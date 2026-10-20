import { expect, test } from '@playwright/test';
import { deploy, hydrated } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

/** Take the coach's suggestion until the hand ends. */
const followCoach = async (page: import('@playwright/test').Page) => {
  const suggested = page.locator('.moves .suggested');
  while (await suggested.count()) await suggested.click();
};

test('poker opens with guided hands: the coach explains each decision, and the showdown names the hands', async ({
  page,
}) => {
  await page.goto('/poker/first-hands/');
  await hydrated(page);
  await expect(page.getByText('Practice points are free')).toBeVisible();
  await page.getByRole('button', { name: 'Deal the first hand' }).click();
  await expect(page.getByLabel('Your cards').getByRole('img', { name: 'Ace of spades' })).toBeVisible();
  await expect(page.getByTestId('coach')).toContainText('one of the best starting hands');
  await followCoach(page);
  await expect(page.getByTestId('result')).toContainText('a pair of kings');
  await expect(page.getByTestId('result')).toContainText('a pair of queens');

  // Folding the weakest hand costs only the small blind.
  await page.getByRole('button', { name: 'Next hand' }).click();
  await followCoach(page);
  await expect(page.getByTestId('result')).toContainText('You folded');
});

test('a learner who already plays can skip ahead, and poker is then met', async ({ page }) => {
  await page.goto('/poker/first-hands/');
  await hydrated(page);
  await page.getByRole('button', { name: 'I already play poker' }).click();
  await expect(page.getByRole('heading', { name: 'You have met poker' })).toBeFocused();
  expect(await page.evaluate(() => localStorage.getItem('chaalwise-done'))).toContain('poker/first-hands');
});

test('a poker lesson shows the cards at the table, and checks the answer', async ({ page }) => {
  await page.goto('/poker/hand-rankings/');
  await hydrated(page);
  // The first reading step: a straight flush from your ace and king of hearts.
  await expect(page.getByLabel('Your cards').getByRole('img', { name: 'Ace of hearts' })).toBeVisible();
  await expect(page.getByLabel('Shared cards').getByRole('img', { name: 'Ten of hearts' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: /nine and eight of spades/ })).toBeVisible();
  await page.getByRole('button', { name: 'A straight, nine high' }).click();
  await expect(page.getByText('a flush beats a straight')).toBeVisible();
  await page.getByRole('button', { name: 'A flush, king high' }).click();
  await expect(page.locator('.option.correct')).toHaveText('A flush, king high');
});

test('the poker course starts with the first hands and lists every lesson', async ({ page }) => {
  await page.goto('/poker/');
  await expect(page.getByRole('link', { name: 'your first hands' })).toHaveAttribute('href', '/poker/first-hands/');
  await expect(page.locator('[data-lesson^="poker/"]')).toHaveCount(7);
});
