import { expect, test } from '@playwright/test';
import { completeLesson, deploy, hydrated } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

test('a track is a course: the idea, its uses, its lessons, and practice with no lesson needed first', async ({
  page,
}) => {
  await page.goto('/skills/think-ahead/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Think ahead');
  await expect(page.getByRole('heading', { name: 'At work' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'In study' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'The blunder check' }).first()).toHaveAttribute(
    'href',
    '/skills/blunder-check/',
  );

  await hydrated(page);
  await expect(page.getByTestId('track-level')).toHaveText('Not started');
  await page.getByRole('button', { name: 'Practise 8 questions' }).click();
  await expect(page.getByRole('heading', { name: 'Practice: Think ahead' })).toBeFocused();
  await expect(page.getByRole('navigation', { name: 'Steps in this lesson' })).toBeVisible();
});

test("a track's review has only its own questions", async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-18T09:00:00') });
  // Chess safety answers train Think ahead.
  await completeLesson(page, 'hanging');
  await page.clock.setSystemTime(new Date('2026-11-18T09:00:00'));

  await page.goto('/skills/think-ahead/');
  await hydrated(page);
  await expect(page.getByTestId('track-board')).toHaveText('Noticing');
  await expect(page.getByTestId('track-due')).toHaveText('3');
  await page.getByRole('link', { name: 'Review Think ahead questions' }).click();
  await expect(page.getByText('Only Think ahead questions.')).toBeVisible();
  await expect(page.getByText('3 to review')).toBeVisible();

  await page.goto('/review/?track=calculate');
  await expect(page.getByTestId('review-empty')).toBeVisible();
});

test('a track poker trains links to its poker lessons and has practice', async ({ page }) => {
  await page.goto('/skills/bluff/');
  await expect(page.getByRole('link', { name: 'Why you bet' }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /^Practise/ })).toBeVisible();
});
