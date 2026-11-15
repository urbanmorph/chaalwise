import { expect, test, type Page } from '@playwright/test';
import { deploy, hydrated } from './helpers';

const day = 86_400_000;
const now = new Date('2026-11-20T09:00:00');
const ago = (days: number) => new Date(now.getTime() - days * day).toISOString();

/** A device that finished three strategy lessons, the blunder check longest ago, loaded from a progress file. */
async function finishedThree(page: Page, days = 10) {
  const lesson = (lessonId: string, age: number) => ({ lessonId, completedAt: ago(age), times: 1, outcomes: {} });
  const file = {
    app: 'chaalwise',
    version: 1,
    exportedAt: now.toISOString(),
    lessons: [
      lesson('strategy/blunder-check', days + 2),
      lesson('strategy/count-it-through', days + 1),
      lesson('strategy/look-at-three', days),
    ],
    cards: [],
  };
  await page.goto('/progress/');
  await hydrated(page);
  await page
    .getByLabel('Load a progress file')
    .setInputFiles({ name: 'progress.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(file)) });
  await page.getByRole('button', { name: 'Replace my progress' }).click();
  await expect(page.getByText(/^Progress loaded from/)).toBeVisible();
}

const next = (page: Page) => page.getByRole('button', { name: /^(Continue|Finish)$/ }).click();

test.beforeEach(async ({ page }) => {
  await deploy(page, 'A');
  await page.clock.install({ time: now });
});

test('"Which idea fits?" opens after three strategy lessons, names the idea only after the answer, and feeds review', async ({
  page,
}) => {
  await page.goto('/review/');
  await hydrated(page);
  await expect(page.getByTestId('fits-note')).toContainText('After 3 strategy lessons');
  await expect(page.getByRole('button', { name: 'Which idea fits?' })).toHaveCount(0);

  await finishedThree(page);
  await page.goto('/review/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Which idea fits?' }).click();
  await expect(page.getByRole('heading', { name: /^Which idea fits\? 6 situations$/ })).toBeFocused();
  const player = page.locator('.mixed .player');
  for (let i = 0; i < 6; i++) {
    // The situation alone: no game, skill or lesson named before the answer.
    await expect(player.getByRole('heading', { level: 2 })).toHaveText(/ Which idea fits\?$/);
    await expect(player.getByTestId('question-context')).toHaveCount(0);
    const options = player.locator('.options button');
    // Only the ideas of finished lessons, in a shuffled order.
    await expect(options).toHaveCount(3);
    expect(new Set(await options.allInnerTexts())).toEqual(
      new Set(['The blunder check', 'Count it through', 'Look at three before choosing']),
    );
    await options.first().click();
    if (await player.getByRole('button', { name: 'Show the answer' }).isVisible())
      await player.getByRole('button', { name: 'Show the answer' }).click();
    const explanation = player.locator('.explanation');
    await expect(explanation).toContainText(/^The idea is “/);
    await expect(explanation).toContainText('Why not “');
    await expect(explanation.getByRole('link', { name: /^Go back to the lesson: / })).toHaveAttribute(
      'href',
      /^\/skills\/(blunder-check|count-it-through|look-at-three)\/$/,
    );
    await next(page);
  }
  await expect(page.getByText('Saved on this device.')).toBeVisible();

  // Each situation is a review card: it comes back on a later day.
  await page.clock.setSystemTime(new Date(now.getTime() + 40 * day));
  await page.goto('/review/');
  await hydrated(page);
  await expect(page.getByText(/^\d+ to review$/)).toBeVisible();
  await expect(page.locator('.player').first().getByRole('heading', { level: 2 })).toHaveText(/ Which idea fits\?$/);
});

test('a week after a lesson, review offers an unannounced case, then says which idea it tested and whether it was used', async ({
  page,
}) => {
  // Six days after the lessons: nothing yet.
  await finishedThree(page, 4);
  await page.goto('/review/');
  await hydrated(page);
  await expect(page.getByTestId('later-case')).toHaveCount(0);

  await finishedThree(page);
  await page.goto('/review/');
  await hydrated(page);
  const later = page.getByTestId('later-case');
  await expect(later.getByRole('heading', { name: 'A new case: The wedding caterer' })).toBeVisible();
  await expect(later).not.toContainText('blunder');
  await later.getByRole('button', { name: 'Start the case' }).click();
  await next(page); // the setting
  await later
    .getByRole('button', { name: "Ask for a signed agreement, and a receipt in the firm's name, before you pay" })
    .click();
  await expect(later.getByText('You found it.')).toBeVisible();
  await next(page);
  await next(page); // the uncle's offer
  await later
    .getByRole('button', { name: "Whether the caterer's agreement lets another cook serve, and what it costs if not" })
    .click();
  await next(page);
  const result = later.getByTestId('later-result');
  await expect(result).toContainText('This case was about The blunder check.');
  await expect(result).toContainText('You used it without being told: right first time in both decisions.');
  await expect(result.getByRole('link', { name: 'The blunder check' })).toHaveAttribute(
    'href',
    '/skills/blunder-check/',
  );
  await expect(result).toContainText('Saved on this device.');

  // Kept on the device: shown on the progress page, and in the progress file.
  await page.goto('/progress/');
  await hydrated(page);
  await expect(page.getByTestId('used-unprompted')).toHaveText('1 of 1');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Save progress to a file' }).click(),
  ]);
  const saved = JSON.parse(
    await (await download.createReadStream()).toArray().then((c) => Buffer.concat(c).toString()),
  );
  expect(saved.later).toMatchObject([{ caseId: 'later/wedding-caterer', idea: 'strategy/blunder-check', used: true }]);

  // Each case comes once: the next one is for the next idea finished.
  await page.goto('/review/');
  await hydrated(page);
  await expect(later.getByRole('heading', { name: 'A new case: The scooter plan' })).toBeVisible();
});
