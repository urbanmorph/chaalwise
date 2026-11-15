import { expect, test } from '@playwright/test';
import { deploy, hydrated } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

test('a strategy lesson ends with a plan you keep, and the review asks a day later whether you used it', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-10-20T09:00:00') });
  await page.goto('/skills/blunder-check/');
  await hydrated(page);
  // The plan is the last step; the step dots go straight to it.
  const dots = page.getByRole('navigation', { name: 'Steps in this lesson' }).getByRole('button');
  await dots.last().click();
  await page.getByLabel('When, in your own words').fill('I reply to a client');
  await expect(page.getByText('When I reply to a client, I will name one thing that could go wrong')).toBeVisible();
  await page.getByRole('button', { name: 'Save my plan' }).click();
  await expect(page.getByText('Saved on this device.')).toBeVisible();

  // Not the same day.
  await page.goto('/review/');
  await hydrated(page);
  await expect(page.getByTestId('plan-check-in')).toHaveCount(0);

  await page.clock.setSystemTime(new Date('2026-10-21T10:00:00'));
  await page.goto('/review/');
  const card = page.getByTestId('plan-check-in');
  await expect(card).toContainText('Your plan: When I reply to a client');
  // Noticing comes first: it is the usual failure. Only then, whether the plan was acted on.
  await expect(card.getByRole('heading')).toHaveText('Did the moment come up, and did you notice it?');
  await card.getByRole('button', { name: 'Yes, I noticed it' }).click();
  await expect(card).toContainText('Did you act on your plan?');
  await card.getByRole('button', { name: 'Yes, I did' }).click();
  await expect(card).toContainText('Was it a good decision, whatever the result?');

  // Answered: not asked again for a week.
  await page.goto('/review/');
  await hydrated(page);
  await expect(page.getByTestId('plan-check-in')).toHaveCount(0);
});

test('a lab ends with a plan after its debrief, kept and asked about in review like a lesson’s', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-20T09:00:00') });
  await page.goto('/labs/ask-the-panel/');
  await hydrated(page);
  const plan = page.getByTestId('lab-plan');
  await plan.getByText('When a group estimates a cost, a time or a number', { exact: true }).click();
  await expect(plan).toContainText(
    'When a group estimates a cost, a time or a number, I will ask each person to write down their own answer first, then compare them.',
  );
  await plan.getByRole('button', { name: 'Save my plan' }).click();
  await expect(plan.getByText('Saved on this device.')).toBeVisible();

  await page.clock.setSystemTime(new Date('2026-10-21T10:00:00'));
  await page.goto('/review/');
  await expect(page.getByTestId('plan-check-in')).toContainText('Your plan: When a group estimates a cost');
});

test('a poker lesson ends with a plan for its skill away from the table, and links to the lab for it', async ({
  page,
}) => {
  await page.goto('/poker/tilt/');
  await hydrated(page);
  await expect(page.getByTestId('try-the-lab').getByRole('link', { name: 'Gain or loss?' })).toBeVisible();
  const dots = page.getByRole('navigation', { name: 'Steps in this lesson' }).getByRole('button');
  await dots.last().click();
  await expect(page.getByText('Use it away from the table this week.')).toBeVisible();
  await page.getByText('When I am about to reply to a message while angry', { exact: true }).click();
  await page.getByRole('button', { name: 'Save my plan' }).click();
  await expect(page.getByText('Saved on this device.')).toBeVisible();
});
