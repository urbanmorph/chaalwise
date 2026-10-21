import { expect, test, type Page } from '@playwright/test';
import { deploy, hydrated, watchShifts } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

/** Rounds played in the current Prisoner's Dilemma match. */
const played = async (page: Page) => Number((await page.getByTestId('pd-round').textContent())!.trim().split(' ')[0]);

/** Open a lab with its game ready to play, and start counting layout shifts. */
async function open(page: Page, slug: string) {
  const shifts = await watchShifts(page);
  await page.goto(`/labs/${slug}/`);
  await hydrated(page);
  return shifts;
}

test('the labs index leads to every lab', async ({ page }) => {
  await page.goto('/labs/');
  for (const name of [
    "Prisoner's Dilemma",
    'Rock-paper-scissors',
    'Sealed-bid auction',
    'Nim',
    'Rule finder',
    'Split the pie',
    'Which bag?',
    'Gain or loss?',
    'The bonus rule',
    'Ask the panel',
  ]) {
    await expect(page.getByRole('link', { name, exact: true })).toBeVisible();
  }
  await page.getByRole('link', { name: 'Rock-paper-scissors', exact: true }).click();
  await expect(page).toHaveURL(/\/labs\/rock-paper-scissors\/$/);
});

test("Prisoner's Dilemma: play two bots in turn, round by round, then reach the debrief", async ({ page }) => {
  const shifts = await open(page, 'prisoners-dilemma');
  await page.getByRole('button', { name: 'Play all five in turn' }).click();
  const cooperate = page.getByRole('button', { name: 'Cooperate' });
  await expect(cooperate).toBeFocused();

  // About ten rounds: the end comes somewhere from round 8 to 12, unannounced.
  for (let round = 1; round <= 12 && (await cooperate.isVisible()); round++) {
    await cooperate.click();
    await expect(page.getByTestId('pd-round')).toContainText(String(round));
  }
  const status = page.getByTestId('pd-status');
  await expect(status).toContainText('That was the last round');
  await expect(status).toBeFocused();
  // Always kind cooperates every round, so both score 3 a round.
  await expect(page.getByTestId('pd-you')).toHaveText(String(3 * (await played(page))));

  // Defecting on always selfish: 1 point each round.
  await page.getByRole('button', { name: 'Next: Always selfish' }).click();
  const defect = page.getByRole('button', { name: 'Defect' });
  for (let i = 0; i < 12 && (await defect.isVisible()); i++) await defect.click();
  await expect(page.getByTestId('pd-you')).toHaveText(String(await played(page)));

  await page.getByRole('button', { name: 'See the debrief' }).click();
  const debrief = page.getByTestId('pd-debrief');
  await expect(debrief.getByRole('heading', { name: 'Debrief' })).toBeFocused();
  await expect(debrief.getByRole('row')).toHaveCount(1 + 2 + 1 + 5);
  await expect(debrief).toContainText('Tit for tat never beats the player it faces');
  expect(await shifts()).toBeLessThan(0.1);

  await expect(page.locator('section.try .stage')).toHaveAttribute('data-steps', /"measures":"cooperate"/);
});

test('Rock-paper-scissors: the bot learns a habit, and the debrief shows how predictable you were', async ({
  page,
}) => {
  const shifts = await open(page, 'rock-paper-scissors');
  const rock = page.getByRole('button', { name: 'Rock', exact: true });
  for (let i = 1; i <= 30; i++) {
    await rock.click();
    await expect(page.getByTestId('rps-round')).toContainText(String(i));
  }
  await expect(rock).toBeDisabled();
  const debrief = page.getByTestId('rps-debrief');
  await expect(debrief.getByRole('heading', { name: 'Debrief' })).toBeFocused();
  await expect(debrief).toContainText('Your favourite throw was rock, 30 times out of 30');
  await expect(debrief).toContainText('Your most common pair in a row was rock then rock, 29 times');
  // Always rock is the easiest habit to read: the bot catches on within a couple of throws.
  expect(Number(await page.getByTestId('rps-you').textContent())).toBeLessThanOrEqual(2);
  expect(await shifts()).toBeLessThan(0.1);

  await debrief.getByRole('button', { name: 'Play again' }).click();
  await expect(page.getByTestId('rps-round')).toContainText('0');
  await expect(rock).toBeFocused();
});

test('Sealed-bid auction: five sealed bids, each revealed, then the debrief', async ({ page }) => {
  const shifts = await open(page, 'sealed-bid-auction');
  await page.getByRole('button', { name: 'Start with the first jar' }).click();
  const input = page.getByLabel('Your sealed bid, in points');
  for (let jar = 1; jar <= 5; jar++) {
    await expect(input).toBeFocused();
    const estimate = Number(await page.getByTestId('auction-estimate').textContent());
    await input.fill(String(estimate - 5));
    await input.press('Enter');
    const result = page.getByTestId('auction-result');
    await expect(result).toBeFocused();
    await expect(result).toContainText('The jar held');
    if (jar < 5) await page.getByRole('button', { name: 'Next jar' }).click();
  }
  await page.getByRole('button', { name: 'See the debrief' }).click();
  const debrief = page.getByTestId('auction-debrief');
  await expect(debrief.getByRole('heading', { name: 'Debrief' })).toBeFocused();
  await expect(debrief.getByRole('row')).toHaveCount(6);
  await expect(debrief).toContainText('On average you bid 5 points below your own estimate');
  expect(await shifts()).toBeLessThan(0.1);
  await expect(page.locator('section.try .stage')).toHaveAttribute('data-steps', /reference\/labs\/winners-curse\//);
});
