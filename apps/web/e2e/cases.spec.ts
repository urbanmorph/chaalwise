import { expect, test, type Page } from '@playwright/test';
import { choose, deploy, hydrated } from './helpers';

/** The group project's decisions, by a word in each prompt, with the right answer. */
const DECISIONS: [RegExp, string][] = [
  [/six weeks/, 'Agree one finished piece for each week, and check it together'],
  [/three days late/, 'Ask him on his own what got in the way, and agree a new date'],
  [/24 hours left/, 'Drop the extra chapter, and do the analysis and writing well'],
  [/got a B/, 'By what you knew when you chose it, not by the mark alone'],
];

const prompt = async (page: Page) =>
  (await page.locator('.player').getByRole('heading', { level: 2 }).textContent()) ?? '';
const answerFor = (text: string) => DECISIONS.find(([pattern]) => pattern.test(text))![1];
const next = (page: Page) => page.getByRole('button', { name: /^(Continue|Finish)$/ }).click();

test.beforeEach(async ({ page }) => deploy(page, 'A'));

test('a work case is reached from the strategy page, played through with no game, and comes back in review', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-10-20T09:00:00') });
  await page.goto('/skills/');
  await page.getByRole('link', { name: 'work cases' }).first().click();
  await expect(page).toHaveURL('/cases/');
  await page.getByRole('link', { name: 'The group project' }).click();
  await hydrated(page);

  // No game to meet first: the story starts at once.
  await expect(page.getByTestId('meet-chess')).toHaveCount(0);
  await expect(page.getByText('Step 1 of 9', { exact: true })).toBeVisible();

  // The story, then a decision; a wrong choice says why, and the learner tries again.
  await next(page);
  await page.getByRole('button', { name: 'Split the four parts, then join them up in week five' }).click();
  await expect(page.getByText(/Nobody sees a problem until week five/)).toBeVisible();
  await choose(page, answerFor(await prompt(page)));

  for (let decision = 1; decision < DECISIONS.length; decision++) {
    // The story carries on between decisions.
    await expect(page.locator('.player h2.reading')).toBeVisible();
    await next(page);
    await choose(page, answerFor(await prompt(page)));
  }

  // A plan to use it, then the case is done and saved.
  await page.getByRole('radio', { name: /When I start a group project/ }).check();
  await expect(page.getByText(/I will agree one finished piece for each week/)).toBeVisible();
  await next(page);
  await expect(page.getByTestId('lesson-done')).toContainText('Case complete');
  await expect(page.getByTestId('lesson-done')).toContainText('Saved on this device.');
  await expect(page.getByRole('link', { name: 'All work cases' })).toHaveAttribute('href', '/cases/');

  // A month on, its decisions come back for review on their own, needing no game.
  await page.clock.setSystemTime(new Date('2026-11-20T09:00:00'));
  await page.goto('/review/');
  await hydrated(page);
  await expect(page.getByText('4 to review')).toBeVisible();
  await expect(page.getByTestId('question-context')).toHaveCount(0);
  for (let i = 0; i < DECISIONS.length; i++) {
    await page.getByRole('button', { name: answerFor(await prompt(page)), exact: true }).click();
    await expect(page.getByText('You found it!')).toBeVisible();
    await next(page);
  }
  await expect(page.getByText('Round done')).toBeVisible();
});

test('each track that a case uses links to it from its course', async ({ page }) => {
  await page.goto('/skills/cooperate/');
  await page.getByRole('link', { name: 'Your first job' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your first job');
  await expect(page.getByRole('navigation', { name: 'All work cases' })).toBeVisible();
});
