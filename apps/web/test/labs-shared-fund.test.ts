import { describe, expect, it } from 'vitest';
import {
  BOARD_RULE,
  botFines,
  ENDOWMENT,
  FINE_COST,
  FINE_HIT,
  fundShare,
  holdBackFines,
  holdBackGain,
  MONTHS,
  NEIGHBOURS,
  PEOPLE,
  playPart,
  roundPoints,
  standings,
  type Month,
} from '../src/lib/labs/shared-fund';
import { between, seeded } from '../src/lib/labs/seeded';

const neighbours = (m: Month) => m.put.slice(1).reduce((s, c) => s + c, 0);
const always = (n: number) => () => n;
const none = () => [];

describe('the shared fund', () => {
  it('has five members, you and four neighbours, each with 10 points a month, for two parts of six months', () => {
    expect(PEOPLE).toBe(5);
    expect(NEIGHBOURS.map((n) => n.id)).toEqual(['rakesh', 'anita', 'dev', 'lakshmi']);
    expect(ENDOWMENT).toBe(10);
    expect(MONTHS).toBe(6);
  });

  it('doubles the fund and shares it equally: each point you put in brings you back 0.4', () => {
    expect(fundShare(10)).toBe(4);
    expect(fundShare(1)).toBeCloseTo(0.4);
  });

  it('pays each to hold back, whatever the others do: keeping a point beats putting it in, every month', () => {
    const r = seeded(5);
    for (let i = 0; i < 2000; i++) {
      const others = Array.from({ length: PEOPLE - 1 }, () => between(0, ENDOWMENT, r));
      const mine = (c: number) => roundPoints([c, ...others], [])[0]!;
      for (let c = 1; c <= ENDOWMENT; c++) expect(mine(c - 1)).toBeGreaterThan(mine(c));
    }
  });

  it('leaves all worse off if all hold back: 20 points each when all put in everything, 10 when nobody does', () => {
    expect(roundPoints([10, 10, 10, 10, 10], [])).toEqual([20, 20, 20, 20, 20]);
    expect(roundPoints([0, 0, 0, 0, 0], [])).toEqual([10, 10, 10, 10, 10]);
  });

  it('charges a fine 1 point to the one who gives it and 3 to the one fined', () => {
    expect(FINE_COST).toBe(1);
    expect(FINE_HIT).toBe(3);
    const [you, rakesh] = roundPoints([10, 0, 0, 0, 0], [{ from: 0, to: 1 }]);
    expect(you).toBeCloseTo(0 + fundShare(10) - 1);
    expect(rakesh).toBeCloseTo(10 + fundShare(10) - 3);
  });

  it('plays the neighbours by their rules: Rakesh puts in nothing, Lakshmi 6, Anita matches the average, Dev a little short', () => {
    const part = playPart('plain', always(10), none);
    expect(part[0]!.put).toEqual([10, 0, 8, 8, 6]);
    // Last month the average was 32 / 5 = 6.4: Anita puts in 6, Dev 1 less.
    expect(part[1]!.put).toEqual([10, 0, 6, 5, 6]);
    for (const m of part) expect(m.fines).toEqual([]);
  });

  it('in part 1, with only the total posted, the neighbours put in less by the last month, whatever you put in', () => {
    for (let c = 0; c <= ENDOWMENT; c++) {
      const part = playPart('plain', always(c), none);
      expect(neighbours(part.at(-1)!), `you put in ${c}`).toBeLessThan(neighbours(part[0]!));
      for (let i = 1; i < MONTHS; i++) expect(neighbours(part[i]!)).toBeLessThanOrEqual(neighbours(part[i - 1]!));
    }
    const r = seeded(11);
    for (let i = 0; i < 2000; i++) {
      const part = playPart('plain', () => between(0, ENDOWMENT, r), none);
      expect(neighbours(part.at(-1)!)).toBeLessThan(neighbours(part[0]!));
    }
  });

  it('in part 1 the free rider ends with more points than anyone who put in something', () => {
    const r = seeded(12);
    for (let i = 0; i < 500; i++) {
      const part = playPart('plain', () => between(0, ENDOWMENT, r), none);
      const totals = standings(part);
      const best = Math.max(...totals);
      expect(totals[1]).toBeCloseTo(best);
    }
  });

  it('in part 2, on the notice board with fines, the neighbours put in at least as much by the last month, whatever you do', () => {
    const r = seeded(13);
    for (let i = 0; i < 3000; i++) {
      const part = playPart(
        'board',
        () => between(0, ENDOWMENT, r),
        () => [1, 2, 3, 4].filter(() => r() < 0.3),
      );
      expect(neighbours(part.at(-1)!)).toBeGreaterThanOrEqual(neighbours(part[0]!));
    }
    for (let c = 0; c <= ENDOWMENT; c++) {
      const plain = playPart('plain', always(c), none);
      const board = playPart('board', always(c), none);
      expect(neighbours(board.at(-1)!), `you put in ${c}`).toBeGreaterThan(neighbours(plain.at(-1)!));
    }
  });

  it('on the board, Lakshmi and Anita fine anyone who puts in under 5; a fined neighbour puts in 2 more for each fine', () => {
    expect(BOARD_RULE).toBe(5);
    const part = playPart('board', always(0), none);
    expect(part[0]!.fines).toEqual([
      { from: 2, to: 0 },
      { from: 2, to: 1 },
      { from: 4, to: 0 },
      { from: 4, to: 1 },
    ]);
    // Rakesh was fined twice: he puts in 4 the next month, then 8 after two more.
    expect(part[1]!.put[1]).toBe(4);
    expect(part[2]!.put[1]).toBe(8);
  });

  it('your own fines make Rakesh put in more, sooner', () => {
    const without = playPart('board', always(10), none);
    const withFines = playPart('board', always(10), (m) => (m.put[1]! < BOARD_RULE ? [1] : []));
    expect(withFines[1]!.put[1]).toBeGreaterThan(without[1]!.put[1]!);
    expect(standings(withFines)[0]).toBeLessThan(standings(without)[0]! + 10);
  });

  it('on the board, putting in nothing no longer pays: you end a month with the most by putting in 5, the rule', () => {
    const others = [0, 8, 8, 6];
    const mine = (c: number) => {
      const put = [c, ...others];
      return roundPoints(put, botFines('board', put))[0]!;
    };
    const best = [...Array(ENDOWMENT + 1).keys()].reduce((b, c) => (mine(c) > mine(b) ? c : b), 0);
    expect(best).toBe(BOARD_RULE);
    expect(mine(0)).toBeLessThan(mine(BOARD_RULE));
    // With only the total posted, nobody fines, and putting in nothing keeps the most.
    expect(botFines('plain', [0, ...others])).toEqual([]);
    // As the debrief puts it: holding back keeps 3, and the two fines cost 6.
    expect(holdBackGain()).toBeCloseTo(mine(0) - mine(BOARD_RULE) + holdBackFines());
    expect(holdBackGain()).toBeCloseTo(3);
    expect(holdBackFines()).toBe(6);
  });
});
