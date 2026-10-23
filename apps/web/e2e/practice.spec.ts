import { expect, test } from '@playwright/test';
import { completeLesson, deploy, hydrated } from './helpers';

test.beforeEach(async ({ page }) => deploy(page, 'A'));

test('after a lesson, "Practise again" gives five new positions of the same idea', async ({ page }) => {
  await completeLesson(page, 'hanging');
  await page.getByRole('button', { name: 'Practise again in new positions' }).click();
  const practice = page.getByRole('region', { name: 'Practice in new positions' });
  await expect(practice.getByRole('heading', { name: 'Practice: 5 new positions' })).toBeFocused();
  await expect(practice.getByRole('navigation', { name: 'Steps in this lesson' }).getByRole('button')).toHaveCount(5);
  await expect(
    practice.getByRole('heading', {
      name: "You play White. One of Black's pieces can be taken for free, or by a cheaper piece. Take it.",
    }),
  ).toBeVisible();
  // A new position, not the lesson's own: generated ones have six pieces, the lesson's three or four.
  await expect(practice.locator('cg-board piece')).toHaveCount(6);
});

test('a due card comes back in a fresh position of the same idea', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-19T09:00:00') });
  await completeLesson(page, 'hanging');
  await page.clock.setSystemTime(new Date('2026-12-19T09:00:00'));
  await page.goto('/review/');
  await hydrated(page);
  await expect(page.getByText(/\d+ to review/)).toBeVisible();
  // The hanging-piece cards return as generated positions with six pieces, not the lesson's four- and five-piece ones.
  const prompts = page.getByRole('heading', {
    name: "You play White. One of Black's pieces can be taken for free, or by a cheaper piece. Take it.",
  });
  const choice = page.getByRole('heading', {
    name: 'In chess, before every move, what should you look for, for both you and your opponent?',
  });
  await expect(prompts.or(choice)).toBeVisible();
});

test('name the square: type the name of the highlighted square', async ({ page }) => {
  await page.goto('/chess/drills/');
  await hydrated(page);
  const drill = page.locator('section', { hasText: 'Coordinates: name the square' });
  await drill.getByRole('button', { name: 'Start' }).click();
  const input = drill.getByLabel('Name the highlighted square');
  await expect(input).toBeFocused();
  // Work out the highlighted square from where it sits on the board (White at the bottom).
  const name = await drill.locator('cg-board').evaluate((board) => {
    const b = board.getBoundingClientRect();
    const s = board.querySelector('square.area')!.getBoundingClientRect();
    const file = Math.round((s.left - b.left) / (b.width / 8));
    const rank = 8 - Math.round((s.top - b.top) / (b.height / 8));
    return 'abcdefgh'.charAt(file) + rank;
  });
  await input.fill(name);
  await input.press('Enter');
  await expect(drill.getByText('1 named')).toBeVisible();
});

for (const [heading, prompt] of [
  ['Pieces: where can it go?', /^Tap every square the (knight|bishop|rook|queen) on [a-h][1-8] can move to\.$/],
  ['Safety: spot the loose piece', /^Tap every loose piece/],
] as const) {
  test(`${heading}: five positions, a wrong tap is counted, and the rest can be shown`, async ({ page }) => {
    await page.goto('/chess/drills/');
    await hydrated(page);
    const drill = page.locator('section', { hasText: heading });
    await drill.getByRole('button', { name: 'Start' }).click();
    for (let i = 0; i < 5; i++) {
      await expect(drill.getByRole('heading', { level: 3, name: prompt })).toBeVisible();
      if (i === 0) {
        // A square that is surely wrong: the piece's own square, or the white king (kings are never loose).
        const wrong = drill
          .locator(heading.startsWith('Pieces') ? 'cg-board piece:not(.king)' : 'cg-board piece.king.white')
          .first();
        // The drill is far down the page: bring the whole board on screen, or the tap lands nowhere.
        await drill.locator('cg-board').scrollIntoViewIfNeeded();
        const box = (await wrong.boundingBox())!;
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await expect(drill.getByText(/· 1 wrong/)).toBeVisible();
      }
      await drill.getByRole('button', { name: 'Show the rest' }).click();
      await drill.getByRole('button', { name: /^(Next|Finish)$/ }).click();
    }
    await expect(drill.getByText('You cleared 0 of 5 positions without a wrong tap.')).toBeVisible();
    await expect(drill.getByText(/Best 0 · last 0\s·\sdone today/)).toBeVisible();
  });
}

test('basic mates in few moves start from a random position', async ({ page }) => {
  await page.goto('/chess/drills/');
  await hydrated(page);
  const drill = page.locator('section', { hasText: 'Basic mates in few moves' });
  await drill.getByRole('button', { name: 'Start' }).click();
  await expect(drill.getByText('20 moves left')).toBeVisible();
  await expect(drill.locator('cg-board piece')).toHaveCount(3);
});
