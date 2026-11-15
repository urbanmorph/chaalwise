import { expect, test } from '@playwright/test';
import { DONE_KEY } from '../src/lib/done-lessons';
import { deploy, hydrated, watchShifts } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

test('Who backs down?: five weeks against each of four rivals, then the debrief and the played record', async ({
  page,
}) => {
  await page.goto('/progress/');
  await hydrated(page);
  const when = page.getByTestId('lab-played-who-backs-down').locator('dd');
  await expect(when).toHaveText('Not yet');

  const shifts = await watchShifts(page);
  await page.goto('/labs/who-backs-down/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Start' }).click();
  const head = page.getByTestId('bd-head');
  const status = page.getByTestId('bd-status');
  const you = page.getByTestId('bd-you');
  const push = () => page.getByRole('button', { name: 'Push', exact: true }).click();
  const give = () => page.getByRole('button', { name: 'Give way', exact: true }).click();

  // Meena always gives way: pushing wins every week.
  await expect(head).toBeFocused();
  await expect(head).toContainText('Against Meena');
  await push();
  await expect(status).toBeFocused();
  await expect(status).toHaveText('Week 1: you pushed, Meena gave way. You got 10, Meena 0.');
  for (let week = 2; week <= 5; week++) await push();
  await expect(you).toHaveText('50');
  await expect(status).toContainText('That was your last week against Meena.');
  await page.getByRole('button', { name: 'Next: Ramesh' }).click();

  // Ramesh never backs down: pushing is a price war, so give way after one.
  await expect(head).toContainText('Against Ramesh');
  await push();
  await expect(status).toHaveText('Week 1: you pushed, Ramesh pushed. You got −10, Ramesh −10.');
  for (let week = 2; week <= 5; week++) await give();
  await expect(you).toHaveText('40');
  await page.getByRole('button', { name: 'Next: Gopal' }).click();

  // Gopal picks on those who give way: give way once, and he pushes next week.
  await give();
  await expect(status).toContainText('you gave way, Gopal gave way');
  await give();
  await expect(status).toContainText('you gave way, Gopal pushed');
  for (let week = 3; week <= 5; week++) await push();
  await expect(you).toHaveText('55');
  await page.getByRole('button', { name: 'Next: Salim' }).click();

  // Salim mixes at random.
  for (let week = 1; week <= 5; week++) await give();
  await expect(page.getByTestId('bd-week')).toContainText('20');
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), DONE_KEY)).toContain('labs/who-backs-down');

  await page.getByRole('button', { name: 'See the debrief' }).click();
  const debrief = page.getByTestId('bd-debrief');
  await expect(debrief.getByRole('heading', { name: 'Debrief' })).toBeFocused();
  await expect(page.getByTestId('bd-rivals').getByRole('row')).toHaveCount(5);
  await expect(page.getByTestId('bd-rivals')).toContainText('about 16.7, either way');
  await expect(page.getByTestId('bd-never')).toContainText('a price war every week, −50 in all');
  await expect(page.getByTestId('bd-shares').getByRole('row')).toHaveCount(6);
  await expect(page.getByTestId('bd-brink')).toContainText('65%');
  await expect(debrief.getByRole('link', { name: 'the Who moves first lab' })).toHaveAttribute(
    'href',
    '/labs/who-moves-first/',
  );
  expect(await shifts()).toBeLessThan(0.1);
  await expect(page.locator('section.try .stage')).toHaveAttribute('data-steps', /life\/hawk-dove\//);
  await expect(page.locator('section.try .stage')).toHaveAttribute('data-steps', /"measures":"size-risk"/);

  await page.goto('/progress/');
  await hydrated(page);
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  await expect(when).toHaveText(today);
});
