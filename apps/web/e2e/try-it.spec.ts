import { expect, test } from '@playwright/test';
import { choose, deploy, typeMove } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

test('a reference idea can be tried on the page, and the answers count towards its skill', async ({ page }) => {
  await page.goto('/reference/strategy/weakest-link/');
  const section = page.locator('section.try');
  await expect(section.locator('svg.diagram')).toBeVisible();
  // The board loads only when asked for.
  await expect(page.locator('cg-board')).toHaveCount(0);
  await section.getByRole('button', { name: 'Try it' }).click();
  await expect(section.locator('cg-board')).toBeVisible();

  await choose(page, 'The bishop on c1');
  await typeMove(page, 'b3');
  await expect(page.getByTestId('try-done')).toContainText('2 of 2 first try');

  await page.goto('/skills/plan-long/');
  await expect(page.getByTestId('track-level')).toHaveText('Noticing');
});

test('an idea from poker or the labs is tried by choosing, with no board', async ({ page }) => {
  await page.goto('/reference/strategy/sunk-cost/');
  await page.locator('section.try').getByRole('button', { name: 'Try it' }).click();
  await choose(page, 'What the knight can do from here');
  await expect(page.locator('cg-board')).toHaveCount(0);
});
