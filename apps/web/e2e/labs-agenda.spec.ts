import { expect, test } from '@playwright/test';
import { DONE_KEY } from '../src/lib/done-lessons';
import { deploy, hydrated, watchShifts } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

test('Who sets the agenda?: chair three meetings, vote in two, then the debrief and the played record', async ({
  page,
}) => {
  await page.goto('/progress/');
  await hydrated(page);
  const when = page.getByTestId('lab-played-who-sets-the-agenda').locator('dd');
  await expect(when).toHaveText('Not yet');

  const shifts = await watchShifts(page);
  await page.goto('/labs/who-sets-the-agenda/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Start' }).click();
  const head = page.getByTestId('ag-head');
  const status = page.getByTestId('ag-status');
  const score = page.getByTestId('ag-score');
  await expect(head).toBeFocused();
  await expect(head).toHaveText('You chair meeting 1');

  // The principal wants a band night: hold it back to the last vote, and it wins.
  await page
    .getByRole('button', { name: 'Comedy show against a dance contest first, then the winner against a band night' })
    .click();
  await expect(status).toBeFocused();
  await expect(page.getByRole('listitem').filter({ hasText: 'Comedy show 8, Dance contest 4' })).toBeVisible();
  await expect(status).toHaveText('The committee chose a band night. You got what the principal asked for.');
  await expect(score).toHaveText('1');

  // The treasurer wants comedy, but holding back the dance contest makes it win instead.
  await page.getByRole('button', { name: 'Next meeting' }).click();
  await expect(head).toBeFocused();
  await page
    .getByRole('button', { name: 'Band night against a comedy show first, then the winner against a dance contest' })
    .click();
  await expect(status).toHaveText('The committee chose a dance contest. Not what the treasurer asked for.');
  await expect(score).toHaveText('1');

  // The sports secretary wants the dance contest: the same order gives it.
  await page.getByRole('button', { name: 'Next meeting' }).click();
  await page
    .getByRole('button', { name: 'Band night against a comedy show first, then the winner against a dance contest' })
    .click();
  await expect(status).toContainText('You got what the sports secretary asked for.');
  await expect(score).toHaveText('2');

  // Kiran holds back comedy. A sincere vote for the dance contest first ends with comedy, the day scholars' last choice.
  await page.getByRole('button', { name: 'Now a bot chairs' }).click();
  await expect(head).toHaveText('Kiran chairs meeting 4');
  await expect(head).toBeFocused();
  await expect(page.getByTestId('ag-round')).toContainText('4');
  await page.getByRole('button', { name: 'Dance contest' }).click();
  await expect(status).toHaveText('Now a dance contest faces a comedy show.');
  await page.getByRole('button', { name: 'Dance contest' }).click();
  await expect(status).toHaveText('The committee chose a comedy show, your group’s last choice.');
  await expect(score).toHaveText('2');

  // Rhea holds back the band night: nothing the day scholars do changes it, and it is their second choice.
  await page.getByRole('button', { name: 'Next meeting' }).click();
  await expect(head).toHaveText('Rhea chairs meeting 5');
  await page.getByRole('button', { name: 'Dance contest' }).click();
  await expect(status).toHaveText('Now a comedy show faces a band night.');
  await page.getByRole('button', { name: 'Band night' }).click();
  await expect(status).toHaveText('The committee chose a band night, your group’s second choice.');
  await expect(score).toHaveText('3');
  // Met as soon as the last meeting is played: its questions open up in practice.
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), DONE_KEY))
    .toContain('labs/who-sets-the-agenda');

  await page.getByRole('button', { name: 'See the debrief' }).click();
  const debrief = page.getByTestId('ag-debrief');
  await expect(debrief.getByRole('heading', { name: 'Debrief' })).toBeFocused();
  await expect(page.getByTestId('ag-cycle')).toContainText('A band night beats a comedy show, 8 votes to 4.');
  await expect(page.getByTestId('ag-cycle')).toContainText('A dance contest beats a band night, 8 votes to 4.');
  await expect(debrief.getByRole('table')).toHaveCount(2);
  await expect(debrief.getByRole('row').filter({ hasText: 'Dance contest (sincere)' })).toHaveCount(2);
  const summary = page.getByTestId('ag-summary');
  await expect(summary).toContainText(
    'a sincere first vote for a dance contest led to a comedy show, your group’s last choice. A strategic first vote for a band night led to a band night, your second.',
  );
  await expect(summary).toContainText('so a sincere vote was already your best');
  expect(await shifts()).toBeLessThan(0.1);
  await expect(page.locator('section.try .stage')).toHaveAttribute('data-steps', /life\/agenda-setting\//);
  await expect(page.locator('section.try .stage')).toHaveAttribute('data-steps', /"measures":"think-ahead"/);

  await page.goto('/progress/');
  await hydrated(page);
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  await expect(when).toHaveText(today);
});
