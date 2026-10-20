import { expect, test } from '@playwright/test';
import { ROUNDS, RULES } from '../src/lib/labs/rule-finder';
import { deploy, hydrated, watchShifts } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

test('Rule finder: test a guess, find it wrong, name the rule, three rounds, then the debrief', async ({ page }) => {
  const shifts = await watchShifts(page);
  await page.goto('/labs/rule-finder/');
  await hydrated(page);
  const status = page.getByTestId('rf-status');
  const tryNumbers = async (triple: readonly number[]) => {
    for (const [i, label] of ['First number', 'Second number', 'Third number'].entries())
      await page.getByLabel(label).fill(String(triple[i]));
    await page.getByLabel('Third number').press('Enter');
  };

  // Round 1, the classic: 2, 4, 6 fits, and "going up by 2" is the tempting guess.
  await expect(page.getByTestId('rf-start')).toHaveText('2, 4, 6');
  await tryNumbers([8, 10, 12]);
  await expect(status).toContainText('Pick your guess first');
  await page.getByLabel('Numbers going up by 2').check();
  await tryNumbers([8, 10, 12]);
  await expect(status).toContainText('8, 10, 12: yes, it fits the rule. Your guess said so too.');
  await tryNumbers([1, 2, 3]);
  await expect(status).toContainText('Your guess said it would not, so your guess is wrong.');
  await page.getByLabel('Any three numbers going up').check();
  await tryNumbers([3, 2, 1]);
  await expect(status).toContainText('3, 2, 1: no, it does not fit');
  await page.getByRole('button', { name: 'That is the rule' }).click();
  await expect(status).toBeFocused();
  await expect(status).toContainText('Right: the rule is');
  await expect(status).toContainText('2 of your 3 tests could have proved your guess wrong');

  // Rounds 2 and 3 are drawn at random: answer the second right and fall for the trap in the third.
  for (const round of [2, 3]) {
    await page.getByRole('button', { name: 'Next round' }).click();
    await expect(page.getByTestId('rf-round')).toContainText(String(round));
    const start = await page.getByTestId('rf-start').textContent();
    const r = ROUNDS.find((x) => x.start.join(', ') === start)!;
    const answer = round === 2 ? r.hidden : r.trap;
    await page.getByLabel(RULES[answer].text, { exact: true }).check();
    await tryNumbers(r.tell);
    await page.getByRole('button', { name: 'That is the rule' }).click();
    await expect(status).toContainText(
      round === 2 ? 'Right' : `Not this time: the rule is “${RULES[r.hidden].text}”. Testing ${r.tell.join(', ')}`,
    );
  }
  await expect(page.getByTestId('rf-found')).toHaveText('2');

  await page.getByRole('button', { name: 'See the debrief' }).click();
  const debrief = page.getByTestId('rf-debrief');
  await expect(debrief.getByRole('heading', { name: 'Debrief' })).toBeFocused();
  await expect(debrief.getByRole('row')).toHaveCount(4);
  await expect(page.getByTestId('rf-summary')).toContainText('You found 2 of 3 rules');
  await expect(debrief).toContainText('confirmation bias');
  expect(await shifts()).toBeLessThan(0.1);
  await expect(page.locator('section.try .stage')).toHaveAttribute('data-entry', 'strategy/test-to-disprove');
  await expect(page.locator('section.try .stage')).toHaveAttribute('data-measures', 'read-hidden');
});
