import { expect, test, type Page } from '@playwright/test';
import { DONE_KEY } from '../src/lib/done-lessons';
import { deploy, hydrated, watchShifts } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

/** Type a split, one share per person, and propose it. */
async function propose(page: Page, names: string[], split: number[]) {
  for (const [i, name] of names.entries())
    await page.getByRole('spinbutton', { name, exact: true }).fill(String(split[i]));
  await page.getByRole('button', { name: 'Propose this split' }).click();
}

test('Fair shares: splits for a stall and a cab, objections, the core and the Shapley split, then the debrief and the played record', async ({
  page,
}) => {
  await page.goto('/progress/');
  await hydrated(page);
  const when = page.getByTestId('lab-played-fair-shares').locator('dd');
  await expect(when).toHaveText('Not yet');

  const shifts = await watchShifts(page);
  await page.goto('/labs/fair-shares/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Start' }).click();
  const head = page.getByTestId('fair-head');
  const status = page.getByTestId('fair-status');
  await expect(head).toBeFocused();
  await expect(head).toHaveText('The fest food stall');

  // The split must add up before it can be proposed.
  const stall = ['Asha', 'Bilal', 'Chitra'];
  await page.getByRole('spinbutton', { name: 'Asha', exact: true }).fill('30');
  await page.getByRole('spinbutton', { name: 'Bilal', exact: true }).fill('30');
  await expect(page.getByTestId('fair-left')).toHaveText('30 left to share.');
  await expect(page.getByRole('button', { name: 'Propose this split' })).toBeDisabled();

  // An equal split: Asha and Bilal would make more without Chitra.
  await propose(page, stall, [30, 30, 30]);
  await expect(status).toBeFocused();
  await expect(status).toContainText(
    'Asha and Bilal object: on their own they would make 72, more than the 60 your split gives them.',
  );
  await expect(page.getByTestId('fair-tries')).toContainText('1');

  // The Shapley split: all three accept.
  await propose(page, stall, [43, 31, 16]);
  await expect(status).toContainText('All three accept: nobody would do better on their own.');
  await expect(page.getByTestId('fair-accepted')).toHaveText('1');
  await expect(page.getByTestId('fair-core')).toContainText('Asha 12 to 66, Bilal 0 to 54, Chitra 6 to 18');
  const working = page.getByTestId('fair-shapley');
  await expect(working.getByRole('row')).toHaveCount(1 + 6 + 1);
  await expect(working.getByRole('row').filter({ hasText: 'Asha, Bilal, Chitra' })).toContainText('126018');
  await expect(working.getByRole('row').last()).toHaveText(/Average.*43\s*31\s*16/);

  // The cab: three tries, none accepted.
  await page.getByRole('button', { name: 'Next: the shared cab' }).click();
  await expect(head).toHaveText('The shared cab');
  await expect(head).toBeFocused();
  const cab = ['Deepa', 'Esha', 'Farid'];
  await propose(page, cab, [30, 30, 30]);
  await expect(status).toContainText(
    'Deepa objects: a cab of their own would cost 24, less than the 30 your split asks of them.',
  );
  await propose(page, cab, [0, 61, 29]);
  await expect(status).toContainText('Esha objects');
  await propose(page, cab, [25, 25, 40]);
  await expect(status).toContainText('Deepa objects');
  await expect(page.getByRole('button', { name: 'Propose this split' })).toHaveCount(0);
  await expect(page.getByTestId('fair-core')).toContainText('Deepa 0 to 24, Esha 0 to 60, Farid 30 to 90');
  await expect(page.getByTestId('fair-shapley').getByRole('row').last()).toHaveText(/Average.*8\s*26\s*56/);
  await expect(page.getByTestId('fair-accepted')).toHaveText('1');
  // Met as soon as the last game is played: its questions open up in practice.
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), DONE_KEY)).toContain('labs/fair-shares');

  await page.getByRole('button', { name: 'See the debrief' }).click();
  const debrief = page.getByTestId('fair-debrief');
  await expect(debrief.getByRole('heading', { name: 'Debrief' })).toBeFocused();
  await expect(debrief.getByRole('table')).toHaveCount(2);
  await expect(debrief).toContainText('Your last split was in the core');
  await expect(debrief).toContainText('Your last split was outside the core');
  const summary = page.getByTestId('fair-summary');
  await expect(summary).toContainText('An equal split, 30 each, draws objections in both.');
  await expect(summary).toContainText(
    'Bilal asked for 45. The core allows it, since Bilal’s range is 0 to 54, but on average Bilal adds 31, 14 less.',
  );
  await expect(summary).toContainText('The Shapley split is in the core in both games.');
  expect(await shifts()).toBeLessThan(0.1);
  await expect(page.locator('section.try .stage')).toHaveAttribute('data-steps', /life\/shapley-value\//);
  await expect(page.locator('section.try .stage')).toHaveAttribute('data-steps', /"measures":"value"/);

  await page.goto('/progress/');
  await hydrated(page);
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  await expect(when).toHaveText(today);
});
