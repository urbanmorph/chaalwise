import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { dailyChess, nextStreak } from '../src/lib/daily';
import { THEMES } from '../src/lib/puzzles';

const dist = (file: string) => readFileSync(new URL(`../dist/${file}`, import.meta.url), 'utf8');

describe('today’s chess puzzle', () => {
  it('is the same for everyone on a day, from the puzzles shipped with the site', () => {
    expect(dailyChess('2026-10-22')).toEqual(dailyChess('2026-10-22'));
    const { theme, band } = dailyChess('2026-10-22');
    expect(THEMES.map((t) => t.id)).toContain(theme.id);
    expect(theme.bands.slice(0, 3)).toContain(band);
  });

  it('changes every day, and goes through every theme within a week', () => {
    const week = Array.from({ length: 7 }, (_, i) => dailyChess(`2026-10-${String(20 + i).padStart(2, '0')}`));
    expect(new Set(week.map((d) => `${d.theme.id}/${d.index}`)).size).toBe(7);
    expect(new Set(week.map((d) => d.theme.id)).size).toBe(THEMES.length);
  });
});

describe('the daily streak, kept on the device', () => {
  it('grows on consecutive days, starts again after a missed day, and counts a day once', () => {
    let s = nextStreak(undefined, '2026-10-20');
    expect(s).toEqual({ last: '2026-10-20', streak: 1, best: 1 });
    s = nextStreak(s, '2026-10-21');
    expect(s.streak).toBe(2);
    expect(nextStreak(s, '2026-10-21')).toEqual(s);
    s = nextStreak(s, '2026-10-23');
    expect(s).toEqual({ last: '2026-10-23', streak: 1, best: 2 });
  });

  it('counts across a month end', () => {
    expect(nextStreak({ last: '2026-10-31', streak: 3, best: 3 }, '2026-11-01').streak).toBe(4);
  });
});

describe('today’s poker puzzle', () => {
  it('is the same for everyone on a day, and a different kind of exercise the next', async () => {
    const { pokerDailyItem } = await import('../src/lib/poker/drills');
    expect(pokerDailyItem('2026-10-22')).toEqual(pokerDailyItem('2026-10-22'));
    expect(pokerDailyItem('2026-10-22').kind).not.toBe(pokerDailyItem('2026-10-23').kind);
  });
});

describe('the daily page', () => {
  it('is built, kept out of nothing, and reached from the home page and every page’s menu', () => {
    expect(existsSync(new URL('../dist/daily/index.html', import.meta.url))).toBe(true);
    expect(dist('index.html')).toContain('href="/daily/"');
    expect(dist('daily/index.html')).toContain('Today’s poker puzzle');
    expect(dist('chess/fork/index.html').match(/<nav aria-label="Main"[\s\S]*?<\/nav>/)![0]).toContain(
      'href="/daily/"',
    );
  });
});
