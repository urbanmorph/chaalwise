import { describe, expect, it } from 'vitest';
import {
  bestKnowing,
  drawStop,
  expectedAgainstBalance,
  pair,
  playPlan,
  points,
  POST,
  QUIT,
  RIVALS,
  STOPS,
  WEEK,
  week,
  type RivalId,
} from '../src/lib/labs/attrition';
import { seeded, type Random } from '../src/lib/labs/seeded';

const stops = (id: RivalId, n: number, random: Random) => Array.from({ length: n }, () => drawStop(id, random));
const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;

describe('wait them out', () => {
  it('makes the post worth 10 points and each week both stay in cost each 1', () => {
    expect(POST).toBe(10);
    expect(WEEK).toBe(1);
    expect(STOPS).toEqual([0, 2, 5, 10, 20]);
  });

  it('settles a week: the one who stays in wins once the other withdraws; both withdrawing gives it to neither', () => {
    // A rival with a stop point of 2 stays in for weeks 1 and 2 and withdraws in week 3.
    expect(week(1, 'stay', 2)).toBe('on');
    expect(week(2, 'stay', 2)).toBe('on');
    expect(week(3, 'stay', 2)).toBe('won');
    expect(week(2, 'withdraw', 2)).toBe('lost');
    expect(week(3, 'withdraw', 2)).toBe('neither');
    // Whoever gets the post, both pay for every week both stayed in.
    expect(points('won', 2)).toBe(8);
    expect(points('lost', 2)).toBe(-2);
    expect(points('neither', 2)).toBe(-2);
  });

  it('plays a plan of staying in at most so many weeks against a stop point', () => {
    expect(playPlan(5, 2)).toEqual({ result: 'won', weeks: 2, points: 8 });
    expect(playPlan(2, 5)).toEqual({ result: 'lost', weeks: 2, points: -2 });
    expect(playPlan(3, 3)).toEqual({ result: 'neither', weeks: 3, points: -3 });
    expect(playPlan(0, 0)).toEqual({ result: 'neither', weeks: 0, points: 0 });
    expect(playPlan(20, 15)).toEqual({ result: 'won', weeks: 15, points: -5 });
  });

  it('has four rivals, whose stop points follow their habits', () => {
    expect(RIVALS.map((r) => r.id)).toEqual(['bina', 'arjun', 'farah', 'kavya']);
    const r = seeded(1);
    expect(new Set(stops('bina', 500, r))).toEqual(new Set([0, 1, 2]));
    expect(new Set(stops('arjun', 500, r))).toEqual(new Set([2, 3, 4]));
    expect(new Set(stops('farah', 500, r))).toEqual(new Set([15, 16, 17, 18, 19, 20]));
  });

  it('Kavya withdraws one week in 11 however long she has stayed in, about 10 weeks on average', () => {
    expect(QUIT).toBeCloseTo(1 / 11);
    const all = stops('kavya', 20_000, seeded(2));
    expect(mean(all)).toBeGreaterThan(9.5);
    expect(mean(all)).toBeLessThan(10.5);
    // The chance she withdraws next week is the same in week 1 as after 8 weeks: weeks paid change nothing.
    const quitsAt = (n: number) => all.filter((s) => s === n).length / all.filter((s) => s >= n).length;
    expect(quitsAt(0)).toBeCloseTo(1 / 11, 1);
    expect(quitsAt(8)).toBeCloseTo(1 / 11, 1);
  });

  it('the best plan, knowing the stop point: outlast a short one, withdraw at once against a long one', () => {
    expect(bestKnowing(2)).toBe(8);
    expect(bestKnowing(15)).toBe(0);
    expect(bestKnowing(10)).toBe(0);
  });

  it('against Kavya every plan averages 0: the weeks paid eat the whole post', () => {
    for (const k of [0, 1, 2, 5, 10, 20, 30]) expect(expectedAgainstBalance(k)).toBeCloseTo(0, 10);
    const r = seeded(3);
    for (const k of [0, 2, 5, 10, 20]) {
      const runs = stops('kavya', 40_000, r).map((s) => playPlan(k, s).points);
      expect(Math.abs(mean(runs)), `stay up to ${k}`).toBeLessThan(0.25);
    }
  });

  it('two who both play like Kavya: about 4.8 weeks each, 20 contests in 21 won, 1 in 3 costing more than the post between them, 1 in 8 each', () => {
    expect(pair.weeks).toBeCloseTo(100 / 21);
    expect(pair.won).toBeCloseTo(20 / 21);
    expect(pair.overPost).toBeCloseTo((100 / 121) ** 6);
    expect(pair.overPost).toBeGreaterThan(0.31);
    expect(pair.overPost).toBeLessThan(0.33);
    expect(pair.eachOver).toBeCloseTo((100 / 121) ** 11);
    // Simulated: two stop points drawn like Kavya's.
    const r = seeded(4);
    const n = 40_000;
    const runs = Array.from({ length: n }, () => {
      const [a, b] = [drawStop('kavya', r), drawStop('kavya', r)];
      const weeks = Math.min(a, b);
      return { weeks, won: a !== b, cost: 2 * weeks * WEEK, a: playPlan(a, b).points };
    });
    expect(mean(runs.map((x) => x.weeks))).toBeCloseTo(pair.weeks, 0);
    expect(mean(runs.map((x) => (x.won ? 1 : 0)))).toBeCloseTo(pair.won, 1);
    expect(mean(runs.map((x) => (x.cost > POST ? 1 : 0)))).toBeCloseTo(pair.overPost, 1);
    expect(mean(runs.map((x) => (x.weeks > POST ? 1 : 0)))).toBeCloseTo(pair.eachOver, 1);
    expect(Math.abs(mean(runs.map((x) => x.a)))).toBeLessThan(0.25);
  });
});
