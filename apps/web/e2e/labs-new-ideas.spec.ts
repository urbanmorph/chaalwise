import { expect, test } from '@playwright/test';
import { deploy, hydrated, watchShifts } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

test('Gain or loss?: eight choices, the same four each put two ways, then where the answers changed', async ({
  page,
}) => {
  const shifts = await watchShifts(page);
  await page.goto('/labs/gain-or-loss/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Start' }).click();
  const head = page.getByTestId('gl-round');
  await expect(head).toBeFocused();
  for (let i = 1; i <= 8; i++) {
    await expect(head).toHaveText(`Choice ${i} of 8`);
    // Always the sure thing when it reads as kept, the gamble when it reads as lost: the usual flip.
    const sure = page.getByRole('button', { name: /^Plan A/ });
    const lost = / lost for sure\.$/.test((await sure.textContent())!.trim());
    await page.getByRole('button', { name: lost ? /^Plan B/ : /^Plan A/ }).click();
  }
  const status = page.getByTestId('gl-status');
  await expect(status).toBeFocused();
  await expect(status).toContainText('Your answer changed with the wording in 4 of 4');

  await page.getByRole('button', { name: 'See the debrief' }).click();
  const debrief = page.getByTestId('gl-debrief');
  await expect(debrief.getByRole('heading', { name: 'Debrief' })).toBeFocused();
  await expect(debrief.getByRole('row')).toHaveCount(5);
  await expect(page.getByTestId('gl-summary')).toContainText('4 of them the usual way');
  await expect(debrief).toContainText('Plan A ends with 200 homes saved for sure');
  expect(await shifts()).toBeLessThan(0.1);
  await expect(page.locator('section.try .stage')).toHaveAttribute('data-steps', /reference\/strategy\/framing\//);
  await expect(page.locator('section.try .stage')).toHaveAttribute('data-steps', /"measures":"composure"/);
});

test('The bonus rule: pay per ticket and see nothing solved, then pay for results, then the debrief', async ({
  page,
}) => {
  const shifts = await watchShifts(page);
  await page.goto('/labs/bonus-rule/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Start week 1' }).click();
  const set = page.getByRole('button', { name: 'Set the rule' });
  await expect(set).toBeDisabled();

  await page.getByLabel('A bonus for each ticket closed').check();
  await set.click();
  const status = page.getByTestId('br-status');
  await expect(status).toBeFocused();
  await expect(status).toContainText('0 customers were helped');
  await expect(page.getByTestId('br-did')).toContainText('with a quick reply that solved nothing');
  await expect(page.getByTestId('br-did')).toContainText('will come back next week');

  for (const week of [2, 3, 4]) {
    await page.getByRole('button', { name: `Week ${week}` }).click();
    await expect(page.getByTestId('br-week')).toContainText(`${week}`);
    await page.getByLabel(/and each repeat question a help page prevents$/).check();
    await set.click();
    await expect(page.getByTestId('br-did')).toContainText('properly');
  }
  await expect(page.getByTestId('br-did')).toContainText('Help pages prevented');
  await expect(page.getByTestId('br-helped')).not.toHaveText('0');

  await page.getByRole('button', { name: 'See the debrief' }).click();
  const debrief = page.getByTestId('br-debrief');
  await expect(debrief.getByRole('heading', { name: 'Debrief' })).toBeFocused();
  await expect(debrief.getByRole('row')).toHaveCount(7);
  await expect(debrief).toContainText('When a measure becomes a target');
  expect(await shifts()).toBeLessThan(0.1);
  await expect(page.locator('section.try .stage')).toHaveAttribute('data-steps', /reference\/strategy\/incentives\//);
  await expect(page.locator('section.try .stage')).toHaveAttribute('data-steps', /"measures":"think-ahead"/);
});

test('Ask the panel: six boxes of dots, alone and after a first voice, then the debrief', async ({ page }) => {
  const shifts = await watchShifts(page);
  await page.goto('/labs/ask-the-panel/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByTestId('panel-round')).toBeFocused();
  let heard = 0;
  for (let box = 1; box <= 6; box++) {
    await expect(page.getByTestId('panel-round')).toHaveText(`Box ${box} of 6`);
    if ((await page.getByTestId('panel-condition').textContent())!.includes('Bot A says')) heard++;
    const input = page.getByLabel('Your guess: how many dots?');
    if (box > 1) await expect(input).toBeFocused();
    await input.fill('300');
    await input.press('Enter');
    const result = page.getByTestId('panel-result');
    await expect(result).toBeFocused();
    await expect(result).toContainText('You said 300');
    await expect(result).toContainText("The panel's average was");
    if (box < 6) await page.getByRole('button', { name: 'Next box' }).click();
  }
  expect(heard).toBe(3);

  await page.getByRole('button', { name: 'See the debrief' }).click();
  const debrief = page.getByTestId('panel-debrief');
  await expect(debrief.getByRole('heading', { name: 'Debrief' })).toBeFocused();
  await expect(debrief.getByRole('row')).toHaveCount(7);
  await expect(page.getByTestId('panel-summary')).toContainText('Guessing alone, the panel');
  await expect(debrief).toContainText('one bot on its own is off by about');
  expect(await shifts()).toBeLessThan(0.1);
  await expect(page.locator('section.try .stage')).toHaveAttribute(
    'data-steps',
    /reference\/strategy\/independent-estimates\//,
  );
  await expect(page.locator('section.try .stage')).toHaveAttribute('data-steps', /"measures":"read-hidden"/);
});
