import { expect, test } from '@playwright/test';
import { deploy, hydrated, watchShifts } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

test('Which bag?: eight draws, then a player to back after a lucky round, then the debrief', async ({ page }) => {
  const shifts = await watchShifts(page);
  await page.goto('/labs/which-bag/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Start part 1' }).click();
  await expect(page.getByTestId('bag-round')).toBeFocused();

  const answer = page.getByRole('button', { name: 'Answer' });
  // Every answer is "mostly red", so it is right whenever the bag was.
  let right = 0;
  for (let round = 1; round <= 8; round++) {
    await expect(page.getByTestId('bag-round')).toHaveText(`Round ${round} of 8`);
    await expect(answer).toBeDisabled();
    if (round === 1) {
      // By keyboard: into the first group, pick, then the next group, then Answer.
      await page.keyboard.press('Tab');
      await page.keyboard.press('Space');
      await page.keyboard.press('Tab');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Tab');
      await expect(answer).toBeFocused();
      await page.keyboard.press('Enter');
    } else {
      await page.getByText('mostly red', { exact: true }).click();
      await page.getByText('70%', { exact: true }).click();
      await answer.click();
    }
    const result = page.getByTestId('bag-result');
    await expect(result).toBeFocused();
    await expect(result).toContainText('You said mostly red, 70% sure. The chance it was mostly red');
    if ((await result.textContent())!.includes('It was a mostly-red bag')) right++;
    await expect(page.getByTestId('bag-score')).toHaveText(`${right} of ${round} right so far`);
    await page.getByRole('button', { name: round < 8 ? 'Next round' : 'On to part 2' }).click();
  }

  await expect(page.getByRole('heading', { name: 'Part 2: back a player' })).toBeFocused();
  await page.getByRole('button', { name: 'Back Asha' }).click();
  const players = page.getByTestId('bag-players');
  await expect(players).toBeFocused();
  await expect(players).toContainText('You backed Asha, who scored');
  await expect(players).toContainText('The round-one top scorer');

  await page.getByRole('button', { name: 'See the debrief' }).click();
  const debrief = page.getByTestId('bag-debrief');
  await expect(debrief.getByRole('heading', { name: 'Debrief' })).toBeFocused();
  await expect(debrief.getByRole('row')).toHaveCount(9);
  await expect(debrief).toContainText(
    'a blue ball comes from a mostly-red bag 24 times and from a mostly-blue bag only 14 times',
  );
  await expect(debrief).toContainText('Nobody changed: the luck did');
  expect(await shifts()).toBeLessThan(0.1);
  await expect(page.locator('section.try .stage')).toHaveAttribute('data-steps', /reference\/strategy\/base-rates\//);
  await expect(page.locator('section.try .stage')).toHaveAttribute('data-steps', /"measures":"weigh-odds"/);
});
