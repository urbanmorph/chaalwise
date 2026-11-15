import { expect, test, type Page } from '@playwright/test';
import { deploy, hydrated } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

/** Save the blunder-check plan with a moment of the learner's own, as the plan step does. */
async function makePlan(page: Page) {
  await page.goto('/skills/blunder-check/');
  await hydrated(page);
  await page.getByRole('navigation', { name: 'Steps in this lesson' }).getByRole('button').last().click();
  await page.getByLabel('When, in your own words').fill('I reply to a client');
  await page.getByRole('button', { name: 'Save my plan' }).click();
  await expect(page.getByText('Saved on this device.')).toBeVisible();
}

test('a check-in that missed the moment offers to go over the "When …" part of the plan', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-20T09:00:00') });
  await makePlan(page);
  // The plan step also offers the journal, for a decision coming up.
  await expect(page.getByRole('link', { name: 'decision journal' })).toHaveAttribute('href', '/progress/#journal');

  await page.clock.setSystemTime(new Date('2026-10-21T10:00:00'));
  await page.goto('/review/');
  const card = page.getByTestId('plan-check-in');
  await card.getByRole('button', { name: 'It came, but I did not notice in time' }).click();
  await expect(card).toContainText('the moment passes before you spot it');
  await expect(card).not.toContainText('Did you act on your plan?');
  await card.getByRole('button', { name: 'Change the “When …” part' }).click();
  await card.getByLabel('When').fill('a client email arrives');
  await expect(card).toContainText('When a client email arrives, I will name one thing that could go wrong');
  await card.getByRole('button', { name: 'Save my plan' }).click();
  await expect(card).toContainText('Saved. You will be asked again in a week.');

  // The changed plan is asked about a week later, not before.
  await page.goto('/review/');
  await hydrated(page);
  await expect(page.getByTestId('plan-check-in')).toHaveCount(0);
  await page.clock.setSystemTime(new Date('2026-10-28T11:00:00'));
  await page.goto('/review/');
  await expect(page.getByTestId('plan-check-in')).toContainText('Your plan: When a client email arrives');
});

test('a check-in that noticed the moment but did not act says why noticing matters', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-20T09:00:00') });
  await makePlan(page);
  await page.clock.setSystemTime(new Date('2026-10-21T10:00:00'));
  await page.goto('/review/');
  const card = page.getByTestId('plan-check-in');
  await card.getByRole('button', { name: 'Yes, I noticed it' }).click();
  await card.getByRole('button', { name: 'No, not this time' }).click();
  await expect(card).toContainText('Noticing is the hard part, and you did it.');
});

test('a decision is written down before it is made, and judged on its date by what was known, before the result is compared', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-11-10T09:00:00') });
  await page.goto('/progress/#journal');
  await hydrated(page);
  const journal = page.getByTestId('journal');
  await journal.getByLabel('What are you deciding?').fill('Whether to take the internship in Pune');
  await journal.getByLabel('What do you expect to happen?').fill('I will learn more than in Bengaluru');
  await journal.getByLabel('How sure are you? (%)').fill('70');
  await journal.getByLabel('When will you look back?').fill('2026-11-17');
  await journal.getByRole('button', { name: 'Save to my journal' }).click();
  await expect(journal.getByRole('listitem')).toContainText('Whether to take the internship in Pune');
  await expect(journal.getByRole('listitem')).toContainText('Look back on 17 Nov 2026');

  // Not before its date.
  await page.goto('/review/');
  await hydrated(page);
  await expect(page.getByTestId('look-back')).toHaveCount(0);

  await page.clock.setSystemTime(new Date('2026-11-17T10:00:00'));
  await page.goto('/review/');
  const card = page.getByTestId('look-back');
  await expect(card).toContainText('You were deciding: Whether to take the internship in Pune');
  // The expectation stays hidden until the decision is judged, so the result cannot colour the judgement.
  await expect(card).not.toContainText('I will learn more than in Bengaluru');
  await card.getByLabel('What happened?').fill('The work was dull, but I learnt a lot');
  await card.getByRole('button', { name: 'Next' }).click();
  await expect(card).toContainText('by what you knew');
  await expect(card).not.toContainText('I will learn more than in Bengaluru');
  await card.getByRole('button', { name: 'Sound, given what I knew' }).click();
  await expect(card).toContainText('You expected: I will learn more than in Bengaluru (70% sure)');
  await expect(card).toContainText('What happened: The work was dull, but I learnt a lot');
  await expect(card.getByRole('link', { name: 'Review calmly: decisions, not results' })).toHaveAttribute(
    'href',
    '/skills/review-calmly/',
  );

  // Asked once.
  await page.goto('/review/');
  await hydrated(page);
  await expect(page.getByTestId('look-back')).toHaveCount(0);
  await page.goto('/progress/#journal');
  await expect(page.getByTestId('journal').getByRole('listitem')).toContainText('Judged: sound, given what you knew');
});

test('a lab and a lesson end with an optional reflection, kept in the same journal', async ({ page }) => {
  await page.goto('/labs/nim/');
  await hydrated(page);
  const reflect = page.getByTestId('reflection');
  await reflect.getByLabel('One thing you would do the same').fill('Count back from the end');
  await reflect.getByLabel('One thing you would change').fill('Choose who starts');
  await reflect.getByRole('button', { name: 'Save to my journal' }).click();
  await expect(reflect).toContainText('Saved in your journal on this device.');

  await page.goto('/skills/review-calmly/');
  await hydrated(page);
  await page.getByRole('navigation', { name: 'Steps in this lesson' }).getByRole('button').last().click();
  await page.getByRole('button', { name: 'Finish' }).click();
  const after = page.getByTestId('reflection');
  await after.getByLabel('One thing you would change').fill('Read the position before answering');
  await after.getByRole('button', { name: 'Save to my journal' }).click();
  await expect(after).toContainText('Saved in your journal on this device.');

  await page.goto('/progress/#journal');
  const entries = page.getByTestId('journal').getByRole('listitem');
  await expect(entries).toHaveCount(2);
  await expect(entries.first()).toContainText('After Review calmly: decisions, not results');
  await expect(entries.last()).toContainText('After Nim');
  await expect(entries.last()).toContainText('Count back from the end');
});
