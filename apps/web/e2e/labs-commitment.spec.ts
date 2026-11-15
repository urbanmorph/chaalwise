import { expect, test } from '@playwright/test';
import { DONE_KEY } from '../src/lib/done-lessons';
import { deploy, hydrated, watchShifts } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

test('Who moves first: judge three threats, move first against two rivals, then the debrief and the played record', async ({
  page,
}) => {
  await page.goto('/progress/');
  await hydrated(page);
  const when = page.getByTestId('lab-played-who-moves-first').locator('dd');
  await expect(when).toHaveText('Not yet');

  const shifts = await watchShifts(page);
  await page.goto('/labs/who-moves-first/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Start' }).click();
  const head = page.getByTestId('wm-head');
  const status = page.getByTestId('wm-status');
  const you = page.getByTestId('wm-you');
  await expect(head).toBeFocused();

  // Raju: the tree shows a price war costs him more than sharing. Guess so, and open.
  await expect(head).toHaveText('Raju’s stall');
  await expect(page.getByRole('figure', { name: /^Beside Raju/ })).toContainText('Start a price war: you −2, Raju 1');
  await page.getByRole('button', { name: 'Share the customers' }).click();
  await page.getByRole('button', { name: 'Open your stall' }).click();
  await expect(status).toBeFocused();
  await expect(status).toContainText('Raju chose to share the customers: you 4, Raju 5. You guessed right.');
  await expect(page.getByTestId('wm-why')).toContainText('The threat was empty');
  await expect(you).toHaveText('4');

  // Meena: her bulk deal makes the threat real. Open anyway and lose.
  await page.getByRole('button', { name: 'Next owner' }).click();
  await expect(head).toHaveText('Meena’s stall');
  await page.getByRole('button', { name: 'Share the customers' }).click();
  await page.getByRole('button', { name: 'Open your stall' }).click();
  await expect(status).toContainText('Meena chose to start a price war: you −2, Meena 3. You guessed wrong.');
  await expect(page.getByTestId('wm-why')).toContainText('The threat was real');
  await expect(you).toHaveText('2');

  // Sunil: a deal he can cancel for free is only words. Stay out, to see what that costs.
  await page.getByRole('button', { name: 'Next owner' }).click();
  await page.getByRole('button', { name: 'Start a price war' }).click();
  await page.getByRole('button', { name: 'Stay out' }).click();
  await expect(status).toContainText('Had you opened, Sunil would have chosen to share the customers, leaving you 4.');
  await expect(you).toHaveText('2');

  // Asha: an announcement changes nothing; she opens, and sharing beats a price war.
  await page.getByRole('button', { name: 'Now the stall is yours' }).click();
  await expect(head).toHaveText('Asha plans to open beside you');
  await expect(head).toBeFocused();
  await expect(page.getByTestId('wm-round')).toContainText('4');
  await page.getByRole('button', { name: 'Announce a price war if anyone opens' }).click();
  await expect(status).toContainText('Asha opens beside you. Your announcement did not change your numbers');
  await page.getByRole('button', { name: 'Share the customers' }).click();
  await expect(status).toContainText('You chose to share the customers: you 5, Asha 4.');
  await expect(you).toHaveText('7');

  // Farhan: the deal keeps him out, but costs more than it saves.
  await page.getByRole('button', { name: 'Next rival' }).click();
  await expect(head).toHaveText('Farhan plans to open beside you');
  await page.getByRole('button', { name: 'Sign the deal' }).click();
  await expect(status).toContainText('Farhan stays out');
  await expect(you).toHaveText('11');
  // Met as soon as the last round is played: its questions open up in practice.
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), DONE_KEY))
    .toContain('labs/who-moves-first');

  await page.getByRole('button', { name: 'See the debrief' }).click();
  const debrief = page.getByTestId('wm-debrief');
  await expect(debrief.getByRole('heading', { name: 'Debrief' })).toBeFocused();
  await expect(debrief.getByRole('table')).toHaveCount(2);
  const summary = page.getByTestId('wm-summary');
  await expect(summary).toContainText('You scored 11 points; the most possible was 21.');
  await expect(summary).toContainText('believing every threat and staying out would have scored 0');
  await expect(summary).toContainText('the deal paid: 8 against 5');
  await expect(summary).toContainText('4 against 5');
  expect(await shifts()).toBeLessThan(0.1);
  await expect(page.locator('section.try .stage')).toHaveAttribute('data-steps', /life\/credible-threats\//);
  await expect(page.locator('section.try .stage')).toHaveAttribute('data-steps', /"measures":"think-ahead"/);

  await page.goto('/progress/');
  await hydrated(page);
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  await expect(when).toHaveText(today);
});
