import { describe, expect, it } from 'vitest';
import {
  BOTS,
  botMove,
  lastRound,
  noisyPair,
  payoff,
  playMatch,
  styleTable,
  type BotId,
  type Move,
} from '../src/lib/labs/dilemma';
import { counter, describePattern, outcome, PatternBot, type Throw } from '../src/lib/labs/rock-paper-scissors';
import { BIDDERS, breakEvenShade, drawItem, settle, simulateAuctions, SPREAD } from '../src/lib/labs/auction';
import { LABS } from '../src/lib/labs/labs';
import { seeded } from '../src/lib/labs/seeded';

describe('a seeded random', () => {
  it('gives the same numbers for the same seed, and different ones for another', () => {
    const a = seeded(7);
    const b = seeded(7);
    const c = seeded(8);
    const first = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(first);
    expect([c(), c(), c()]).not.toEqual(first);
  });

  it('stays in [0, 1) and spreads evenly', () => {
    const r = seeded(1);
    const xs = Array.from({ length: 10_000 }, r);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...xs)).toBeLessThan(1);
    const mean = xs.reduce((s, x) => s + x, 0) / xs.length;
    expect(mean).toBeCloseTo(0.5, 1);
  });
});

describe("the Prisoner's Dilemma", () => {
  it('pays 3 each for both cooperating, 5 and 0 for defecting on a cooperator, 1 each for both defecting', () => {
    expect(payoff('C', 'C')).toEqual([3, 3]);
    expect(payoff('D', 'C')).toEqual([5, 0]);
    expect(payoff('C', 'D')).toEqual([0, 5]);
    expect(payoff('D', 'D')).toEqual([1, 1]);
  });

  it('is a dilemma: defecting pays more in any one round whatever the other does, yet both cooperating beats both defecting', () => {
    for (const them of ['C', 'D'] as Move[]) expect(payoff('D', them)[0]).toBeGreaterThan(payoff('C', them)[0]);
    expect(payoff('C', 'C')[0]).toBeGreaterThan(payoff('D', 'D')[0]);
  });

  it('ends at a round between 8 and 12, so nobody knows the last one', () => {
    const r = seeded(3);
    const ends = new Set(Array.from({ length: 500 }, () => lastRound(r)));
    expect([...ends].sort((a, b) => a - b)).toEqual([8, 9, 10, 11, 12]);
  });

  it('has five bots, each with a name and a style', () => {
    expect(BOTS.map((b) => b.id)).toEqual(['kind', 'selfish', 'tit-for-tat', 'forgiving', 'random']);
    for (const bot of BOTS) expect(bot.name && bot.style).toBeTruthy();
  });

  const never = () => 0.99;
  it('always kind cooperates and always selfish defects, whatever you do', () => {
    for (const theirs of [[], ['D'], ['C', 'D', 'D']] as Move[][]) {
      expect(botMove('kind', theirs, never)).toBe('C');
      expect(botMove('selfish', theirs, never)).toBe('D');
    }
  });

  it('tit-for-tat cooperates first, then copies your last move', () => {
    expect(botMove('tit-for-tat', [], never)).toBe('C');
    expect(botMove('tit-for-tat', ['D'], never)).toBe('D');
    expect(botMove('tit-for-tat', ['D', 'C'], never)).toBe('C');
  });

  it('forgiving tit-for-tat forgives a defection about 1 time in 3', () => {
    expect(botMove('forgiving', [], never)).toBe('C');
    expect(botMove('forgiving', ['C'], () => 0)).toBe('C');
    expect(botMove('forgiving', ['D'], () => 0.1)).toBe('C');
    expect(botMove('forgiving', ['D'], () => 0.5)).toBe('D');
    const r = seeded(5);
    const forgiven = Array.from({ length: 3000 }, () => botMove('forgiving', ['D'], r)).filter((m) => m === 'C');
    expect(forgiven.length / 3000).toBeCloseTo(1 / 3, 1);
  });

  it('the random bot cooperates about half the time', () => {
    const r = seeded(9);
    const moves = Array.from({ length: 2000 }, () => botMove('random', [], r));
    expect(moves.filter((m) => m === 'C').length / 2000).toBeCloseTo(0.5, 1);
  });

  it('tit-for-tat never scores more than its partner in a match', () => {
    const r = seeded(11);
    for (const other of BOTS) {
      for (let i = 0; i < 20; i++) {
        const [tft, them] = playMatch('tit-for-tat', other.id, 10 + i, r).totals;
        expect(tft).toBeLessThanOrEqual(them);
      }
    }
  });

  it('a match keeps every round, and its totals add up', () => {
    const match = playMatch('kind', 'selfish', 10, seeded(1));
    expect(match.rounds).toHaveLength(10);
    expect(match.totals).toEqual([0, 50]);
  });

  it('the style table is the same every time: selfishness wins a mixed field at first, then dies out', () => {
    const a = styleTable();
    expect(styleTable()).toEqual(a);
    const row = (id: BotId) => a.find((r) => r.id === id)!;
    expect(row('tit-for-tat').average).toBeGreaterThan(row('kind').average);
    expect(row('forgiving').average).toBeGreaterThan(row('kind').average);
    // Against a field with pushovers in it, always selfish earns most per round...
    expect(Math.max(...a.map((r) => r.average))).toBe(row('selfish').average);
    // ...and grows at first, but when styles that score well grow, it runs out of people to exploit.
    expect(row('selfish').early).toBeGreaterThan(0.2);
    const share = (id: BotId) => row(id).share;
    expect(share('selfish')).toBeLessThan(0.01);
    expect(share('tit-for-tat') + share('forgiving')).toBeGreaterThan(0.8);
  });

  it('when moves are misread, forgiveness keeps two careful players cooperating', () => {
    const { titForTat, forgiving } = noisyPair();
    expect(forgiving).toBeGreaterThan(titForTat);
  });
});

describe('rock-paper-scissors', () => {
  it('knows what beats what', () => {
    expect(counter('rock')).toBe('paper');
    expect(counter('paper')).toBe('scissors');
    expect(counter('scissors')).toBe('rock');
    expect(outcome('rock', 'scissors')).toBe('win');
    expect(outcome('rock', 'paper')).toBe('loss');
    expect(outcome('rock', 'rock')).toBe('draw');
  });

  it('plays at random until it has seen a pattern', () => {
    const bot = new PatternBot();
    expect(bot.predict()).toBeUndefined();
    expect(bot.play(() => 0)).toBe('rock');
    expect(bot.play(() => 0.99)).toBe('scissors');
  });

  it('counts what follows your last two throws and plays the counter to the likeliest next one', () => {
    const bot = new PatternBot();
    for (const t of ['rock', 'rock', 'paper', 'rock', 'rock', 'paper', 'rock', 'rock'] as Throw[]) bot.see(t);
    expect(bot.predict()).toBe('paper');
    expect(bot.play(() => 0)).toBe('scissors');
  });

  it('beats a fixed pattern by a wide margin over 30 rounds', () => {
    const bot = new PatternBot();
    const cycle: Throw[] = ['rock', 'paper', 'scissors'];
    const r = seeded(2);
    let botWins = 0;
    let learnerWins = 0;
    for (let i = 0; i < 30; i++) {
      const mine = cycle[i % 3]!;
      const theirs = bot.play(r);
      bot.see(mine);
      const o = outcome(mine, theirs);
      if (o === 'win') learnerWins++;
      if (o === 'loss') botWins++;
    }
    expect(botWins).toBeGreaterThanOrEqual(20);
    expect(learnerWins).toBeLessThanOrEqual(4);
  });

  it('cannot exploit a uniformly random mix', () => {
    const bot = new PatternBot();
    const r = seeded(4);
    const throws: Throw[] = ['rock', 'paper', 'scissors'];
    let net = 0;
    const n = 6000;
    for (let i = 0; i < n; i++) {
      const mine = throws[Math.floor(r() * 3)]!;
      const o = outcome(mine, bot.play(r));
      bot.see(mine);
      net += o === 'win' ? 1 : o === 'loss' ? -1 : 0;
    }
    expect(Math.abs(net / n)).toBeLessThan(0.04);
  });

  it('describes how predictable you were: your most common pair and your favourite throw', () => {
    const p = describePattern(['rock', 'rock', 'paper', 'rock', 'rock', 'paper', 'scissors']);
    expect(p.pair).toEqual({ first: 'rock', then: 'rock', count: 2 });
    expect(p.favourite).toEqual({ throw: 'rock', count: 4 });
    expect(describePattern(['rock']).pair).toBeUndefined();
  });
});

describe('the sealed-bid auction', () => {
  it('draws a value nobody knows, and estimates within the spread of it', () => {
    const r = seeded(6);
    for (let i = 0; i < 100; i++) {
      const item = drawItem(r);
      expect(item.estimates).toHaveLength(BIDDERS);
      for (const e of item.estimates) expect(Math.abs(e - item.value)).toBeLessThanOrEqual(SPREAD);
    }
  });

  it('the highest bid wins and pays its bid; profit is value minus bid', () => {
    const result = settle(100, [90, 120, 80, 110, 70]);
    expect(result.winner).toBe(1);
    expect(result.profit).toBe(-20);
  });

  it('a tie goes to the first bidder', () => {
    expect(settle(50, [60, 60, 10, 10, 10]).winner).toBe(0);
  });

  it('when everyone bids their estimate, the winner loses points on average with several bidders', () => {
    const { winnerProfit, winnerWasMostOptimistic } = simulateAuctions(5, 0, 4000, seeded(12));
    expect(winnerProfit).toBeLessThan(-10);
    expect(winnerWasMostOptimistic).toBe(1);
  });

  it('the curse grows with more bidders, and shading by the break-even amount removes it', () => {
    const two = simulateAuctions(2, 0, 4000, seeded(13)).winnerProfit;
    const eight = simulateAuctions(8, 0, 4000, seeded(13)).winnerProfit;
    expect(eight).toBeLessThan(two);
    expect(breakEvenShade(5)).toBeCloseTo(SPREAD * (4 / 6));
    const shaded = simulateAuctions(5, breakEvenShade(5), 4000, seeded(14)).winnerProfit;
    expect(Math.abs(shaded)).toBeLessThan(2);
  });
});

describe('the labs', () => {
  it('lists three labs, each training its track, with a reference entry for the debrief questions', () => {
    expect(LABS.map((l) => [l.slug, l.track, l.entry])).toEqual([
      ['prisoners-dilemma', 'cooperate', 'labs/prisoners-dilemma'],
      ['rock-paper-scissors', 'unpredictable', 'labs/mixed-strategy'],
      ['sealed-bid-auction', 'value', 'labs/winners-curse'],
    ]);
  });
});
