import { existsSync, readFileSync } from 'node:fs';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { dailyChess } from '../src/lib/daily';
import { DAILY_KEY, exportDaily, finishDaily, importDaily, nextStreak, readDaily } from '../src/lib/streak';
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

describe('the streak, in the progress file', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('goes into the file, and comes back from it on another device', () => {
    finishDaily('chess', '2026-10-21', true);
    finishDaily('poker', '2026-10-22', false);
    const file = JSON.parse(JSON.stringify(exportDaily()));
    localStorage.removeItem(DAILY_KEY);
    importDaily(file);
    expect(readDaily()).toEqual({
      streak: { last: '2026-10-22', streak: 2, best: 2 },
      done: { chess: { date: '2026-10-21', right: true }, poker: { date: '2026-10-22', right: false } },
    });
  });

  it('a device with no streak yet puts nothing in the file', () => {
    expect(exportDaily()).toBeUndefined();
  });

  it('replaces the streak on this device, like the rest of the file; a file with none clears it', () => {
    finishDaily('chess', '2026-10-22', true);
    importDaily({ streak: { last: '2026-10-20', streak: 5, best: 9 }, done: {} });
    expect(readDaily()).toEqual({ streak: { last: '2026-10-20', streak: 5, best: 9 }, done: {} });
    // Files saved before October 2026 have no streak at all.
    importDaily(undefined);
    expect(localStorage.getItem(DAILY_KEY)).toBeNull();
  });

  it('keeps only the well-formed parts of a file', () => {
    importDaily({
      streak: { last: '2026-10-20', streak: 5, best: 9 },
      done: {
        chess: { date: '2026-10-20', right: 'yes' },
        poker: { date: '2026-10-20', right: true },
        go: { date: '2026-10-20', right: true },
      },
    });
    expect(readDaily()).toEqual({
      streak: { last: '2026-10-20', streak: 5, best: 9 },
      done: { poker: { date: '2026-10-20', right: true } },
    });
    importDaily({ streak: { last: 'yesterday', streak: -1, best: 2.5 }, done: [] });
    expect(readDaily()).toEqual({ done: {} });
    expect(localStorage.getItem(DAILY_KEY)).toBeNull();
  });
});
