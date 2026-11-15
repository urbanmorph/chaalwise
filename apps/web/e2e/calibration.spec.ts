import { expect, test, type Page } from '@playwright/test';
import { deploy, hydrated } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

/** Every record in one of the device's stores. */
const records = (page: Page, store: 'attempts' | 'cards') =>
  page.evaluate(
    (name) =>
      new Promise<{ confidence?: number }[]>((resolve) => {
        const open = indexedDB.open('chaalwise');
        open.onsuccess = () => {
          const all = open.result.transaction(name).objectStore(name).getAll();
          all.onsuccess = () => resolve(all.result);
        };
      }),
    store,
  );

test('a calibration round asks how sure you are before every answer, then scores the round; the answers join review', async ({
  page,
}) => {
  await page.goto('/review/');
  await hydrated(page);
  await page.getByRole('button', { name: 'How sure? A calibration round' }).click();
  await expect(page.getByRole('heading', { name: 'Calibration round: 10 questions' })).toBeFocused();
  await expect(page.getByTestId('calibration-intro')).toContainText(
    'The questions mix chess, poker, the labs and life',
  );

  for (let i = 0; i < 10; i++) {
    const options = page.locator('.option');
    // No answer until you say how sure you are.
    await expect(page.getByText('Pick one, then answer')).toBeVisible();
    await expect(options.first()).toBeDisabled();
    await page.getByText('90%', { exact: true }).click();
    // Pick options in turn until the question is graded.
    const done = page.getByRole('button', { name: /^(Continue|Finish)$/ });
    for (let o = 0; !(await done.isVisible()); o++) await options.nth(o).click();
    await done.click();
  }

  const score = page.getByTestId('calibration-score');
  await expect(score).toContainText(/Score 0\.\d\d\. You said 90% sure on average and were right \d+% of the time\./);
  await expect(score).toContainText('0 is perfect, lower is better');
  // The chart: each level with how often it was right, labelled.
  await expect(score.getByRole('listitem').filter({ hasText: '90% sure' })).toContainText(/\d+%, \d+ of 10$/);

  await expect.poll(async () => (await records(page, 'attempts')).filter((a) => a.confidence === 0.9).length).toBe(10);
  await expect.poll(async () => (await records(page, 'cards')).length).toBe(10);
});

test('the progress page scores each setting once it has 10 answers, and says what to do', async ({ page }) => {
  await page.goto('/progress/');
  await hydrated(page);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const open = indexedDB.open('chaalwise');
        open.onsuccess = () => {
          const tx = open.result.transaction('attempts', 'readwrite');
          const at = new Date();
          const add = (item: string, confidence: number, right: boolean) =>
            tx.objectStore('attempts').add({
              skill: 'think-ahead',
              outcome: right ? 'first-try' : 'missed',
              at,
              source: 'practice',
              item,
              confidence,
            });
          // Life: said 90% ten times, right five. Chess: said 70% ten times, right seven. Poker: four answers.
          for (let i = 0; i < 10; i++) add('fits/blunder-check/angry-email', 0.9, i < 5);
          for (let i = 0; i < 10; i++) add('chess/blunder-check/first-question', 0.7, i < 7);
          for (let i = 0; i < 4; i++) add('poker/a-bet-tells-a-story/compare', 0.5, true);
          tx.oncomplete = () => resolve();
        };
      }),
  );
  await page.reload();

  const settings = page.getByTestId('calibration-settings');
  // (5 × 0.01 + 5 × 0.81) / 10 = 0.41.
  const life = settings.locator('[data-setting="life"]');
  await expect(life).toContainText('Score 0.41. You said 90% sure on average and were right 50% of the time.');
  await expect(life).toContainText(
    'You are overconfident on life questions (work, study and everyday): you were right less often than you said. Slow down and look for what could make you wrong.',
  );
  // (7 × 0.09 + 3 × 0.49) / 10 = 0.21.
  const chess = settings.locator('[data-setting="chess"]');
  await expect(chess).toContainText('Score 0.21.');
  await expect(chess).toContainText('Your sureness matched your results on chess questions.');
  await expect(settings.locator('[data-setting="poker"]')).toContainText('4 of 10 answers so far.');
  await expect(page.getByTestId('calibration-across')).toContainText(
    'Your sureness does not carry across settings yet.',
  );

  // The chart's figures, as a table.
  await page.getByText('Show as a table').last().click();
  await expect(page.getByTestId('calibration').getByRole('row', { name: /90% sure/ })).toHaveText(/10\s*50%/);
});
