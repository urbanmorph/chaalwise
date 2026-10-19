import { describe, expect, it } from 'vitest';
import { dashboard, radarPoint } from '../src/lib/dashboard';

const now = new Date('2026-10-19T12:00:00Z');
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);
const attempt = (skill: string, outcome: 'first-try' | 'missed' | 'with-help', n: number) => ({
  skill,
  outcome,
  at: daysAgo(n),
  source: 'lesson' as const,
});

describe('the dashboard numbers for a period', () => {
  const attempts = {
    safety: [attempt('safety', 'first-try', 1), attempt('safety', 'missed', 2), attempt('safety', 'first-try', 40)],
    board: [attempt('board', 'first-try', 1), attempt('board', 'with-help', 1)],
  };

  it('counts tries, the first-time rate and the days practised within the period', () => {
    const d = dashboard(attempts, 30, now);
    expect(d.tries).toBe(4);
    expect(d.firstTimeRate).toBe(0.5);
    expect(d.daysPractised).toBe(2);
  });

  it('includes everything for all time', () => {
    expect(dashboard(attempts, undefined, now).tries).toBe(5);
  });

  it('gives each strategy track its rate from the chess answers that train it, with no rate where there were no tries', () => {
    const d = dashboard(attempts, 30, now);
    expect(d.skills.find((s) => s.id === 'think-ahead')).toMatchObject({ tries: 2, firstTry: 1, rate: 0.5 });
    expect(d.skills.find((s) => s.id === 'plan-long')).toMatchObject({ tries: 0, rate: undefined });
    // The chart shows the tracks chess trains; board sense is the game, not a track.
    expect(d.skills.map((s) => s.id)).toEqual(['think-ahead', 'calculate', 'plan-long', 'size-risk', 'composure']);
  });

  it('is all zeros for a new learner', () => {
    expect(dashboard({}, 30, now)).toMatchObject({ tries: 0, firstTimeRate: undefined, daysPractised: 0 });
  });
});

describe('radar geometry', () => {
  it('puts the first axis straight up and goes round clockwise', () => {
    const top = radarPoint(0, 4, 1, 100);
    expect(top.x).toBeCloseTo(0);
    expect(top.y).toBeCloseTo(-100);
    const right = radarPoint(1, 4, 1, 100);
    expect(right.x).toBeCloseTo(100);
    expect(right.y).toBeCloseTo(0);
  });

  it('scales by the value: half a rate is half way out', () => {
    expect(radarPoint(2, 4, 0.5, 100).y).toBeCloseTo(50);
  });
});
