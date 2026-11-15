import { describe, expect, it } from 'vitest';
import {
  BALANCE,
  bestPlan,
  blowUpChance,
  everyWeek,
  expected,
  FIGHT,
  payoff,
  PRIZE,
  playRival,
  RIVALS,
  WEEKS,
  type Move,
} from '../src/lib/labs/hawk-dove';
import { seeded } from '../src/lib/labs/seeded';

const pushRate = (moves: Move[]) => moves.filter((m) => m === 'push').length / moves.length;

describe('who backs down', () => {
  it('pays 5 each for sharing, 10 to whoever pushes against one who gives way, and costs both 10 in a price war', () => {
    expect(payoff('give', 'give')).toBe(5);
    expect(payoff('push', 'give')).toBe(10);
    expect(payoff('give', 'push')).toBe(0);
    expect(payoff('push', 'push')).toBe(-10);
    // Hawk-dove: the prize is 10, a fight costs the loser 30, and each side is as likely to lose.
    expect(PRIZE).toBe(10);
    expect(FIGHT).toBe(30);
    expect(payoff('push', 'push')).toBe((PRIZE - FIGHT) / 2);
  });

  it('has four rivals, five weeks each', () => {
    expect(RIVALS.map((r) => r.id)).toEqual(['meena', 'ramesh', 'gopal', 'salim']);
    expect(WEEKS).toBe(5);
  });

  it('plays each rival by its rule', () => {
    const r = seeded(1);
    expect(playRival('meena', everyWeek('push'), r).them).toEqual(everyWeek('give'));
    expect(playRival('ramesh', everyWeek('give'), r).them).toEqual(everyWeek('push'));
    // Gopal gives way at first, then pushes after you gave way and gives way after you pushed.
    expect(playRival('gopal', ['give', 'give', 'push', 'give', 'push'], r).them).toEqual([
      'give',
      'push',
      'push',
      'give',
      'push',
    ]);
  });

  it('Salim pushes about one week in three, at random', () => {
    const r = seeded(2);
    const moves = Array.from({ length: 3000 }, () => playRival('salim', everyWeek('give'), r).them).flat();
    expect(pushRate(moves)).toBeCloseTo(1 / 3, 1);
  });

  it('the best plan: push against Meena and Gopal, give way to Ramesh', () => {
    expect(bestPlan('meena')).toEqual({ moves: everyWeek('push'), points: 50 });
    expect(bestPlan('ramesh')).toEqual({ moves: everyWeek('give'), points: 0 });
    expect(bestPlan('gopal')).toEqual({ moves: everyWeek('push'), points: 50 });
    // Never backing down against Ramesh: a price war every week.
    expect(playRival('ramesh', everyWeek('push'), seeded(1)).points).toBe(-50);
  });

  it('the balance: when a rival pushes one time in three, pushing and giving way pay the same, 3.3 a week', () => {
    expect(BALANCE).toBeCloseTo(PRIZE / FIGHT);
    expect(expected('push', BALANCE)).toBeCloseTo(expected('give', BALANCE));
    expect(expected('push', BALANCE)).toBeCloseTo(10 / 3);
    // Push more than that, and giving way pays; less, and pushing pays.
    expect(expected('give', 0.5)).toBeGreaterThan(expected('push', 0.5));
    expect(expected('push', 0.2)).toBeGreaterThan(expected('give', 0.2));
    // Simulated against Salim: either move earns about 3.3 a week.
    const r = seeded(3);
    for (const move of ['push', 'give'] as const) {
      let points = 0;
      for (let i = 0; i < 4000; i++) points += playRival('salim', everyWeek(move), r).points / (4000 * WEEKS);
      expect(points).toBeGreaterThan(2.8);
      expect(points).toBeLessThan(3.9);
    }
  });

  it('a name for never backing down pays while few rivals share it, and costs once more than one in three do', () => {
    // Rivals who know your name give way; those who never back down fight.
    const neverBack = (share: number) => expected('push', share);
    const giveWay = (share: number) => expected('give', share);
    expect(neverBack(0)).toBe(10);
    expect(neverBack(0.1)).toBeGreaterThan(giveWay(0.1));
    expect(neverBack(0.5)).toBeLessThan(giveWay(0.5));
    expect(neverBack(BALANCE)).toBeCloseTo(giveWay(BALANCE));
  });

  it('brinkmanship: with a 1 in 10 chance a week that a stand-off blows up, the risk grows to about two in three by 10 weeks', () => {
    expect(blowUpChance(1)).toBeCloseTo(0.1);
    expect(blowUpChance(5)).toBeCloseTo(1 - 0.9 ** 5);
    expect(blowUpChance(10)).toBeGreaterThan(0.65);
    expect(blowUpChance(10)).toBeLessThan(0.66);
    const r = seeded(4);
    let blown = 0;
    for (let i = 0; i < 5000; i++) if (Array.from({ length: 5 }, () => r() < 0.1).some(Boolean)) blown += 1 / 5000;
    expect(blown).toBeCloseTo(blowUpChance(5), 1);
  });
});
