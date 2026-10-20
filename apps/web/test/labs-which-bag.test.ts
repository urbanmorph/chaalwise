import { describe, expect, it } from 'vitest';
import {
  BAGS,
  bagRounds,
  chanceRed,
  counts,
  drawPlayers,
  PLAYERS,
  playRound,
  regression,
  type Draw,
} from '../src/lib/labs/which-bag';
import { seeded } from '../src/lib/labs/seeded';

const draw = (red: number, blue: number): Draw => ({ red, blue });

describe('which bag: base rates', () => {
  it('has 8 mostly-red bags and 2 mostly-blue ones', () => {
    expect(BAGS.red.count).toBe(8);
    expect(BAGS.blue.count).toBe(2);
    expect(BAGS.red.reds + BAGS.red.blues).toBe(10);
    expect(BAGS.red.reds).toBeGreaterThan(BAGS.red.blues);
    expect(BAGS.blue.blues).toBeGreaterThan(BAGS.blue.reds);
  });

  it('counts, out of 100 picks, how often each kind of bag gives one ball', () => {
    expect(counts(draw(0, 1))).toEqual({ picks: 100, red: 24, blue: 14 });
    expect(counts(draw(1, 0))).toEqual({ picks: 100, red: 56, blue: 6 });
  });

  it('counts two balls out of 1,000 picks, so the counts stay whole', () => {
    expect(counts(draw(0, 2))).toEqual({ picks: 1000, red: 72, blue: 98 });
    expect(counts(draw(1, 1))).toEqual({ picks: 1000, red: 336, blue: 84 });
  });

  it('a single blue ball still most likely came from a mostly-red bag (Bayes)', () => {
    expect(chanceRed(draw(0, 1))).toBeCloseTo(24 / 38);
    expect(chanceRed(draw(0, 1))).toBeGreaterThan(0.5);
    expect(chanceRed(draw(0, 2))).toBeLessThan(0.5);
    // One of each tells you nothing: you are back at the base rate.
    expect(chanceRed(draw(1, 1))).toBeCloseTo(0.8);
    expect(chanceRed(draw(2, 0))).toBeGreaterThan(chanceRed(draw(1, 0)));
  });

  it('plays eight rounds, each a draw of one or two balls, with blue balls in several', () => {
    const rounds = bagRounds(seeded(3));
    expect(rounds).toHaveLength(8);
    for (const r of rounds) expect(r.draw.red + r.draw.blue).toBeOneOf([1, 2]);
    expect(rounds.filter((r) => r.draw.blue > 0).length).toBeGreaterThanOrEqual(4);
  });

  it('picks the bag at the right odds for what was drawn', () => {
    const r = seeded(5);
    let blueDraws = 0;
    let redBags = 0;
    for (let i = 0; i < 2000; i++)
      for (const round of bagRounds(r).filter((x) => x.draw.red === 0 && x.draw.blue === 1)) {
        blueDraws++;
        if (round.bag === 'red') redBags++;
      }
    expect(redBags / blueDraws).toBeCloseTo(24 / 38, 1);
  });
});

describe('which bag: regression to the mean', () => {
  it('has ten players whose scores are skill plus luck', () => {
    const players = drawPlayers(seeded(2));
    expect(players).toHaveLength(PLAYERS);
    for (const p of players) {
      expect(p.form).toBeGreaterThan(0);
      expect(p.first).not.toBe(p.skill);
    }
  });

  it('the round-one top scorer is never the player with the best record, so the pick is a real choice', () => {
    const r = seeded(6);
    for (let i = 0; i < 200; i++) {
      const players = drawPlayers(r);
      const top = players.reduce((a, b) => (b.first > a.first ? b : a));
      const best = players.reduce((a, b) => (b.form > a.form ? b : a));
      expect(top).not.toBe(best);
    }
  });

  it('round two is the same skill with fresh luck', () => {
    const r = seeded(7);
    const players = drawPlayers(r);
    const second = playRound(players, r);
    expect(second).toHaveLength(PLAYERS);
    expect(second).not.toEqual(players.map((p) => p.first));
  });

  it('the round-one top three fall back towards the average in round two, and the bottom three rise', () => {
    const { top, bottom } = regression(4000, seeded(8));
    expect(top.second).toBeLessThan(top.first - 5);
    expect(bottom.second).toBeGreaterThan(bottom.first + 5);
    // They fall back towards the average, not past it: skill is real.
    expect(top.second).toBeGreaterThan(bottom.second);
  });
});
