import { describe, expect, it } from 'vitest';
import {
  DEMAND,
  drawDemand,
  holdRule,
  paidFor,
  playWeek,
  RULES,
  START,
  TEAM_HOURS,
  WEEKS,
  type RuleId,
} from '../src/lib/labs/bonus-rule';
import { seeded } from '../src/lib/labs/seeded';

const flat = Array<number>(WEEKS).fill(DEMAND);
const total = (rule: RuleId, demand = flat) => {
  const weeks = holdRule(rule, demand);
  const last = weeks.at(-1)!;
  return {
    helped: weeks.reduce((s, w) => s + w.helped, 0),
    paid: weeks.reduce((s, w) => s + paidFor(w), 0),
    waiting: last.after.backlog + last.after.reopened,
    turnedAway: weeks.reduce((s, w) => s + w.turnedAway, 0),
  };
};

describe('the bonus rule: a week of work', () => {
  it('gives a team of four bots 40 hours each, and about 48 new problems a week', () => {
    expect(TEAM_HOURS).toBe(160);
    for (const d of drawDemand(seeded(1))) expect(Math.abs(d - DEMAND)).toBeLessThanOrEqual(3);
    expect(drawDemand(seeded(2))).toEqual(drawDemand(seeded(2)));
  });

  it('paid per ticket closed, the bots rush every ticket and split each into three, and solve nothing', () => {
    const { week, state } = playWeek(START, 'closed', 48);
    expect(week).toMatchObject({ fixed: 0, rushed: 48, split: 96, helped: 0 });
    expect(paidFor(week)).toBe(144);
    // Rushed tickets come back next week.
    expect(state.reopened).toBe(48);
  });

  it('paid for fewer tickets, the bots turn customers away', () => {
    const { week } = playWeek(START, 'fewer', 48);
    expect(week).toMatchObject({ turnedAway: 48, logged: 0, helped: 0 });
    expect(paidFor(week)).toBe(48);
  });

  it('paid per hour logged, the bots stretch each fix to fill the hours', () => {
    expect(playWeek(START, 'hours', 48).week).toMatchObject({ fixed: 20, helped: 20 });
    expect(paidFor(playWeek(START, 'hours', 48).week)).toBe(TEAM_HOURS);
  });

  it('with no bonus they work at a steady pace; paid per problem solved, as fast as they can', () => {
    expect(playWeek(START, 'flat', 48).week.fixed).toBe(30);
    expect(playWeek(START, 'solved', 48).week).toMatchObject({ fixed: 40, helped: 40 });
  });

  it('paid for problems solved and headed off, they write help pages first, which cut later weeks’ problems', () => {
    const one = playWeek(START, 'prevented', 48);
    expect(one.week).toMatchObject({ pages: 4, fixed: 32, prevented: 0, helped: 32 });
    const two = playWeek(one.state, 'prevented', 48);
    expect(two.week).toMatchObject({ pages: 4, prevented: 8, arrived: 40, helped: 40 });
    const three = playWeek(two.state, 'prevented', 48);
    // Only eight common questions are worth a page.
    expect(three.week).toMatchObject({ pages: 0, prevented: 16, fixed: 40 });
  });

  it('carries unworked problems over as a backlog', () => {
    const { state } = playWeek(START, 'solved', 48);
    expect(state.backlog).toBe(8);
    expect(playWeek(state, 'solved', 48).week.queue).toBe(56);
  });
});

describe('the bonus rule held for four weeks', () => {
  it('gets the most help from paying for problems solved and headed off, though it starts slower', () => {
    expect(total('prevented')).toMatchObject({ helped: 184, waiting: 8 });
    expect(total('solved')).toMatchObject({ helped: 160, waiting: 32 });
    expect(total('flat')).toMatchObject({ helped: 120 });
    expect(total('hours')).toMatchObject({ helped: 80 });
    expect(holdRule('prevented', flat)[0]!.helped).toBeLessThan(holdRule('solved', flat)[0]!.helped);
  });

  it('pays most for the rules that help least: the measure goes up while the goal goes nowhere', () => {
    expect(total('closed')).toMatchObject({ helped: 0 });
    expect(total('closed').paid).toBeGreaterThan(800);
    expect(total('closed').waiting).toBeGreaterThan(150);
    expect(total('fewer')).toMatchObject({ helped: 0, turnedAway: 192 });
  });

  it('keeps that order whatever the weeks bring', () => {
    for (let seed = 0; seed < 100; seed++) {
      const demand = drawDemand(seeded(seed));
      const helped = (Object.keys(RULES) as RuleId[]).map((r) => [r, total(r, demand).helped] as const);
      const best = helped.reduce((a, b) => (b[1] > a[1] ? b : a));
      expect(best[0]).toBe('prevented');
    }
  });
});
