import { expect, test } from '@playwright/test';
import { deploy, hydrated } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

const toStep = async (page: import('@playwright/test').Page, fromEnd: number) => {
  const dots = page.getByRole('navigation', { name: 'Steps in this lesson' }).getByRole('button');
  await dots.nth((await dots.count()) - fromEnd).click();
};

test('a newcomer to chess sees a strategy lesson’s board questions worked through, until they meet chess', async ({
  page,
}) => {
  await page.goto('/skills/blunder-check/');
  await hydrated(page);
  await expect(page.getByTestId('meet-chess')).toContainText('Play your first moves');
  await toStep(page, 2); // the compare step, on a board
  await expect(page.locator('.player h2')).toContainText('Worked example.');
  await expect(page.locator('.options button')).toHaveCount(0);

  await page.goto('/chess/first-moves/');
  await hydrated(page);
  await page.getByRole('button', { name: 'I already play chess' }).click();
  await expect(page.getByRole('heading', { name: 'You have met chess' })).toBeFocused();

  await page.goto('/skills/blunder-check/');
  await hydrated(page);
  await expect(page.getByTestId('meet-chess')).toBeHidden();
  await toStep(page, 2);
  await expect(page.locator('.options button')).toHaveCount(3);
});

test('the first moves explain each move as it comes, against a gentle bot', async ({ page }) => {
  await page.goto('/chess/first-moves/');
  await hydrated(page);
  await expect(page.getByTestId('coach')).toContainText('Pawns move straight ahead');
  await page.getByLabel('Or type your move').fill('e4');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByTestId('coach')).toContainText('Knights jump in an L');
});

test('mixed practice asks a newcomer only what they can answer: no chess or lab questions before they meet them', async ({
  page,
}) => {
  await page.goto('/review/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Practise a mix' }).click();
  const dots = page.getByRole('navigation', { name: 'Steps in this lesson' }).getByRole('button');
  await expect(dots.first()).toBeVisible();
  for (let i = 0; i < (await dots.count()); i++) {
    await dots.nth(i).click();
    await expect(page.getByTestId('question-context')).toHaveCount(0);
  }
});
