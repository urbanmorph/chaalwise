import { expect, test } from '@playwright/test';
import { deploy, hydrated, watchShifts } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

test('Pick the same: four meet-ups, eight hunts, then the debrief', async ({ page }) => {
  const shifts = await watchShifts(page);
  await page.goto('/labs/pick-the-same/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Start' }).click();
  const head = page.getByTestId('cw-head');
  const status = page.getByTestId('cw-status');
  await expect(head).toBeFocused();

  // Part one: pick what stands out each time.
  for (const [i, answer] of [
    'Heads',
    'The main railway station, under its clock',
    '12 noon',
    'Bottom right',
  ].entries()) {
    await expect(head).toHaveText(`Meet-up ${i + 1} of 4`);
    await page.getByRole('button', { name: answer, exact: true }).click();
    await expect(status).toBeFocused();
    await expect(status).toContainText(/You matched \d+ of 10 bots/);
    await expect(page.getByTestId('cw-like')).toContainText('Asked for their own favourite instead');
    await page.getByRole('button', { name: i < 3 ? 'Next meet-up' : 'On to the hunt' }).click();
  }

  // Part two: a hunt with no word fails, because Chen was let down before.
  await expect(head).toHaveText('Hunt 1 of 8');
  await page.getByRole('button', { name: 'Say nothing' }).click();
  await page.getByRole('button', { name: 'Hunt the stag' }).click();
  await expect(status).toBeFocused();
  await expect(status).toContainText('The stag got away');
  await expect(page.getByTestId('cw-hunters')).toContainText('Chen hunted a hare');
  await expect(page.getByTestId('cw-you')).toHaveText('0');

  // Going first, where all can see, every time after: every stag is caught but the day Dev takes another offer.
  for (let hunt = 2; hunt <= 8; hunt++) {
    await page.getByRole('button', { name: 'Next hunt' }).click();
    await expect(head).toHaveText(`Hunt ${hunt} of 8`);
    await page.getByRole('button', { name: 'Set out first, where all can see' }).click();
    await expect(status).toBeFocused();
  }
  await expect(page.getByTestId('cw-you')).toHaveText('36');
  await expect(page.getByTestId('cw-caught')).toHaveText('6');

  await page.getByRole('button', { name: 'See the debrief' }).click();
  const debrief = page.getByTestId('cw-debrief');
  await expect(debrief.getByRole('heading', { name: 'Debrief' })).toBeFocused();
  await expect(debrief.getByRole('table')).toHaveCount(2);
  await expect(page.getByTestId('cw-summary')).toContainText('36 points');
  await expect(page.getByTestId('cw-summary')).toContainText('24');
  await expect(debrief).toContainText('Dev');
  expect(await shifts()).toBeLessThan(0.1);
  await expect(page.locator('section.try .stage')).toHaveAttribute('data-steps', /reference\/strategy\/coordination\//);
  await expect(page.locator('section.try .stage')).toHaveAttribute('data-steps', /"measures":"cooperate"/);
});
