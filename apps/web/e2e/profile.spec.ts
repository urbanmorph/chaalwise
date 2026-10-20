import { expect, test } from '@playwright/test';
import { completeLesson, deploy, hydrated, watchShifts } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

test('a new learner starts on the home page with a strategy lesson, and every skill is not started', async ({
  page,
}) => {
  await page.goto('/');
  const card = page.getByTestId('home-next-focus');
  await expect(card.getByRole('link', { name: 'Start the first lesson' })).toHaveAttribute(
    'href',
    /^\/skills\/[a-z-]+\/$/,
  );
  await page.goto('/progress/');
  await hydrated(page);
  await expect(page.locator('[data-skill] .label').first()).toHaveText('Not started');
  await expect(page.getByTestId('next-focus')).toContainText('Think ahead');
});

test('finishing a lesson builds the profile from your own answers, and sets the next focus', async ({ page }) => {
  await completeLesson(page, 'hanging');
  await page.goto('/progress/');
  await hydrated(page);
  // Chess safety answers show beside the track, on the board; they are not evidence of the skill off it.
  const ahead = page.locator('[data-skill="think-ahead"]');
  await expect(ahead.locator('.label')).toHaveText('Not started');
  await expect(ahead.getByTestId('on-board')).toHaveText('On the board: Noticing');
  await expect(page.getByTestId('next-focus')).toContainText('Think ahead');
  await expect(page.locator('[data-game-skill="safety"]')).toContainText('Noticing');

  await page.goto('/');
  const card = page.getByTestId('home-next-focus');
  await expect(card).toBeVisible();
  await expect(card.getByRole('link', { name: 'Your next focus: Think ahead' })).toHaveAttribute(
    'href',
    '/skills/think-ahead/',
  );
});

test('strategy skills not measured yet say where they will come from instead of showing a level', async ({ page }) => {
  await page.goto('/progress/');
  await hydrated(page);
  await expect(page.locator('[data-skill="bluff"]')).toContainText('Comes with poker.');
});

test('the progress page does not jump about as the profile loads', async ({ page }) => {
  await completeLesson(page, 'hanging');
  const shifts = await watchShifts(page);
  await page.goto('/progress/');
  await hydrated(page);
  await expect(page.locator('[data-skill="think-ahead"] [data-testid="on-board"]')).toHaveText(
    'On the board: Noticing',
  );
  expect(await shifts()).toBeLessThan(0.1);
});

test("the home page does not jump when a returning learner's next focus loads", async ({ page }) => {
  await completeLesson(page, 'hanging');
  const shifts = await watchShifts(page);
  await page.goto('/');
  await expect(page.getByTestId('home-next-focus')).toContainText('Think ahead');
  expect(await shifts()).toBeLessThan(0.1);
});

test('the dashboard: tiles and radar for a period, a tooltip by keyboard, and the same figures as a table', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-10-19T09:00:00') });
  await completeLesson(page, 'hanging');
  await page.goto('/progress/');
  await hydrated(page);
  await expect(page.getByTestId('tile-tries')).toHaveText('3');
  await expect(page.getByTestId('tile-rate')).toHaveText('100%');

  // The think-ahead point carries its figures for keyboard and screen-reader users, and shows the tooltip on focus.
  const point = page.getByRole('img', { name: 'Think ahead: 100% first time, 3 of 3' });
  await point.focus();
  await expect(page.locator('.tooltip')).toContainText('100% first time');

  await page.getByText('Show as a table').click();
  await expect(page.getByRole('row', { name: 'Think ahead 3 100%' })).toBeVisible();

  // A month later the 7-day view is empty; all time still counts them.
  await page.clock.setSystemTime(new Date('2026-11-19T09:00:00'));
  await page.reload();
  await hydrated(page);
  await page.getByText('7 days').click();
  await expect(page.getByTestId('tile-tries')).toHaveText('0');
  await expect(page.getByTestId('tile-rate')).toHaveText('–');
  await page.getByText('All time').click();
  await expect(page.getByTestId('tile-tries')).toHaveText('3');

  // Improvement areas start with the next focus.
  await expect(page.locator('.improve > li')).toHaveCount(3);
  await expect(page.locator('.improve > li').first()).toContainText('Think ahead');
});
