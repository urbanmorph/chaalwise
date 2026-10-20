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

test('options come in a fresh order, and a wrong pick says why it fails', async ({ page }) => {
  // With Math.random at 0, the shuffle is predictable: the first option moves to the end.
  await page.addInitScript(() => (Math.random = () => 0));
  await page.goto('/reference/strategy/weakest-link/');
  const stage = page.locator('section.try .stage');
  const [first] = JSON.parse((await stage.getAttribute('data-steps'))!) as {
    options: string[];
    answer: number;
    feedback: string[];
  }[];
  await stage.getByRole('button', { name: 'Try it' }).click();

  await expect(page.locator('.options button')).toHaveCount(first!.options.length);
  const shown = await page.locator('.options button').allTextContents();
  expect(shown.map((t) => t.trim())).not.toEqual(first!.options);
  expect([...shown.map((t) => t.trim())].sort()).toEqual([...first!.options].sort());

  const wrong = first!.options.findIndex((_, i) => i !== first!.answer);
  await page.getByRole('button', { name: first!.options[wrong], exact: true }).click();
  await expect(page.getByText(first!.feedback[wrong]!)).toBeVisible();
});

test('a round ends on a right answer: the ones missed can be gone over again at once', async ({ page }) => {
  await page.goto('/reference/strategy/sunk-cost/');
  const stage = page.locator('section.try .stage');
  const steps = JSON.parse((await stage.getAttribute('data-steps'))!) as {
    prompt: string;
    options: string[];
    answer: number;
  }[];
  await stage.getByRole('button', { name: 'Try it' }).click();

  // Miss the first question (two wrong picks), answer the rest.
  const [first, ...rest] = steps;
  const wrong = first!.options.find((_, i) => i !== first!.answer)!;
  for (let i = 0; i < 2; i++) await page.getByRole('button', { name: wrong, exact: true }).click();
  for (const step of rest) {
    await page.getByRole('button', { name: /^(Continue|Finish)$/ }).click();
    await page.getByRole('button', { name: step.options[step.answer], exact: true }).click();
  }
  await page.getByRole('button', { name: 'Finish', exact: true }).click();

  await page.getByRole('button', { name: 'Go over the one you missed' }).click();
  await expect(page.getByRole('heading', { name: first!.prompt })).toBeVisible();
});

test('saying how sure you are is optional, and the progress page shows how often you were right at each level', async ({
  page,
}) => {
  await page.goto('/reference/strategy/weakest-link/');
  const stage = page.locator('section.try .stage');
  const [first] = JSON.parse((await stage.getAttribute('data-steps'))!) as { options: string[]; answer: number }[];
  await stage.getByRole('button', { name: 'Try it' }).click();
  await page.getByText('90%').click();
  await page.getByRole('button', { name: first!.options[first!.answer], exact: true }).click();
  await expect(page.getByText('You found it!')).toBeVisible();

  // The answer is saved as it is given: wait until it has landed before leaving the page.
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise<number>((resolve) => {
            const open = indexedDB.open('chaalwise');
            open.onsuccess = () => {
              const all = open.result.transaction('attempts').objectStore('attempts').getAll();
              all.onsuccess = () => resolve(all.result.filter((a: { confidence?: number }) => a.confidence === 0.9).length);
            };
          }),
      ),
    )
    .toBe(1);
  await page.goto('/progress/');
  await expect(page.getByTestId('calibration').getByRole('row', { name: /90% sure/ })).toHaveText(/1\s*100%/);
});
