import { expect, test } from '@playwright/test';
import { DONE_KEY } from '../src/lib/done-lessons';
import { deploy, hydrated, watchShifts } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

test('Split it fairly?: four offers, four sends, four returns, then the debrief and the played record', async ({
  page,
}) => {
  await page.goto('/progress/');
  await hydrated(page);
  const when = page.getByTestId('lab-played-split-it-fairly').locator('dd');
  await expect(when).toHaveText('Not yet');

  const shifts = await watchShifts(page);
  await page.goto('/labs/split-it-fairly/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Start' }).click();
  const head = page.getByTestId('sf-head');
  const status = page.getByTestId('sf-status');
  const you = page.getByTestId('sf-you');
  const play = async (label: RegExp, points: number) => {
    const input = page.getByLabel(label);
    await expect(input).toBeFocused();
    await input.fill(String(points));
    await input.press('Enter');
    await expect(status).toBeFocused();
  };
  const next = () => page.getByRole('button', { name: 'Next' }).click();

  // The ultimatum game: 1 is enough for Arjun, not for Kavya.
  await expect(head).toHaveText('Split 100 points with Arjun');
  await play(/^Points you offer Arjun/, 1);
  await expect(status).toHaveText('Arjun accepts: you keep 99, and Arjun gets 1.');
  await next();
  await play(/^Points you offer Kavya/, 10);
  await expect(status).toHaveText('Kavya says no: you both get nothing.');
  await next();
  await play(/^Points you offer Priya/, 40);
  await next();
  await play(/^Points you offer Kabir/, 50);
  await expect(you).toHaveText('209');
  await next();

  // The trust game: Meera pays trust back, Vikram keeps it.
  await expect(head).toHaveText('Trust Meera?');
  await expect(page.getByTestId('sf-before')).toHaveText('You have not dealt with Meera before.');
  await play(/^Points you send Meera/, 10);
  await expect(status).toHaveText('You sent 10; it became 30. Meera sent back 15, so you end the round with 15.');
  await next();
  await play(/^Points you send Vikram/, 5);
  await expect(status).toContainText('Vikram sent back 0');
  await next();
  await expect(page.getByTestId('sf-before')).toHaveText(
    'Last time you sent 10; it became 30, and Meera sent back 15.',
  );
  await play(/^Points you send Meera/, 10);
  await next();
  await play(/^Points you send Vikram/, 0);
  await expect(you).toHaveText('254');
  await next();

  // Sending back: half each time, so Neha sends all 10; then keep it all in the last round.
  await expect(head).toHaveText('Neha trusts you');
  await expect(page.getByTestId('sf-got')).toHaveText('15');
  await play(/^Points you send back to Neha/, 8);
  await expect(status).toHaveText(
    'You sent back 8 and kept 7. Neha ends the round with 13, more than she started with.',
  );
  for (const back of [15, 15]) {
    await next();
    await expect(page.getByTestId('sf-got')).toHaveText('30');
    await play(/^Points you send back to Neha/, back);
  }
  await next();
  await play(/^Points you send back to Neha/, 0);
  await expect(you).toHaveText('321');
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), DONE_KEY))
    .toContain('labs/split-it-fairly');

  await page.getByRole('button', { name: 'See the debrief' }).click();
  const debrief = page.getByTestId('sf-debrief');
  await expect(debrief.getByRole('heading', { name: 'Debrief' })).toBeFocused();
  await expect(debrief.getByRole('table')).toHaveCount(4);
  await expect(page.getByTestId('sf-crowd').getByRole('row')).toHaveCount(7);
  await expect(page.getByTestId('sf-crowd')).toContainText('56');
  const summary = page.getByTestId('sf-summary');
  await expect(summary).toContainText('You kept 67 points');
  await expect(summary).toContainText('keeps 27');
  await expect(summary).toContainText('keeps 52');
  expect(await shifts()).toBeLessThan(0.1);
  await expect(page.locator('section.try .stage')).toHaveAttribute('data-steps', /life\/fairness-and-trust\//);
  await expect(page.locator('section.try .stage')).toHaveAttribute('data-steps', /"measures":"cooperate"/);

  await page.goto('/progress/');
  await hydrated(page);
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  await expect(when).toHaveText(today);
});
