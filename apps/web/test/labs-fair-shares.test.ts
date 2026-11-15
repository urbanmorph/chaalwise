import { describe, expect, it } from 'vitest';
import {
  addedIn,
  coreRanges,
  equalSplit,
  GAMES,
  inCore,
  members,
  objections,
  ORDERS,
  shapley,
  TRIES,
  worth,
  type SplitGame,
} from '../src/lib/labs/fair-shares';

const [stall, cab] = GAMES as [SplitGame, SplitGame];
const ALL = 0b111;

/** Every whole-number split of a game's total among three. */
function* splits(total: number) {
  for (let a = 0; a <= total; a++) for (let b = 0; b <= total - a; b++) yield [a, b, total - a - b];
}

describe('fair shares: the two games', () => {
  it('a fest food stall that three friends make points from, and a cab three colleagues share', () => {
    expect(GAMES.map((g) => [g.id, g.kind])).toEqual([
      ['stall', 'value'],
      ['cab', 'cost'],
    ]);
    expect(stall.players.map((p) => p.name)).toEqual(['Asha', 'Bilal', 'Chitra']);
    expect(cab.players.map((p) => p.name)).toEqual(['Deepa', 'Esha', 'Farid']);
    for (const g of GAMES) {
      expect(g.title && g.about).toBeTruthy();
      for (const p of g.players) expect(p.role).toBeTruthy();
    }
    expect(TRIES).toBe(3);
  });

  it('together they do better than any person or pair on their own', () => {
    // A value game: the stall makes more than any group without someone.
    for (let s = 1; s < ALL; s++) expect(worth(stall, ALL)).toBeGreaterThan(worth(stall, s));
    expect(worth(stall, ALL)).toBe(90);
    // A cost game: the shared cab costs less than the fares of any group plus the rest riding alone.
    for (let s = 1; s < ALL; s++) expect(worth(cab, ALL)).toBeLessThan(worth(cab, s) + worth(cab, ALL ^ s));
    expect(worth(cab, ALL)).toBe(90);
  });

  it('a cab costs the fare to the farthest stop of those in it', () => {
    const fares = [24, 60, 90];
    for (let s = 1; s <= ALL; s++) expect(worth(cab, s)).toBe(Math.max(...members(s).map((i) => fares[i]!)));
  });
});

describe('fair shares: who objects', () => {
  it('in the stall, an equal split of 30 each makes Asha and Bilal object: together they make 72, and get 60', () => {
    expect(equalSplit(stall)).toEqual([30, 30, 30]);
    expect(objections(stall, [30, 30, 30])).toEqual([{ who: [0, 1], own: 72, given: 60 }]);
  });

  it('in the cab, an equal split of 30 each makes Deepa object: alone her fare is 24', () => {
    expect(objections(cab, [30, 30, 30])).toEqual([{ who: [0], own: 24, given: 30 }]);
  });

  it('a person or pair objects only if leaving would leave them strictly better off', () => {
    for (const g of GAMES)
      for (const x of splits(90))
        for (const o of objections(g, x)) {
          const given = o.who.reduce((s, i) => s + x[i]!, 0);
          expect(o.given).toBe(given);
          expect(g.kind === 'value' ? o.own > given : o.own < given).toBe(true);
        }
  });

  it('the core (no objection) is exactly the splits inside each person’s range', () => {
    for (const g of GAMES) {
      const ranges = coreRanges(g);
      for (const x of splits(90)) {
        const inside = x.every((xi, i) => xi >= ranges[i]![0] && xi <= ranges[i]![1]);
        expect(inCore(g, x), `${g.id} ${x}`).toBe(inside);
      }
    }
  });

  it('the stall’s ranges: Asha 12 to 66, Bilal 0 to 54, Chitra 6 to 18; the cab’s: Deepa 0 to 24, Esha 0 to 60, Farid 30 to 90', () => {
    expect(coreRanges(stall)).toEqual([
      [12, 66],
      [0, 54],
      [6, 18],
    ]);
    expect(coreRanges(cab)).toEqual([
      [0, 24],
      [0, 60],
      [30, 90],
    ]);
  });

  it('the core is not empty, but wide: many splits stop every objection', () => {
    for (const g of GAMES) expect([...splits(90)].filter((x) => inCore(g, x)).length).toBeGreaterThan(50);
  });

  it('Bilal’s demand of half, 45, can be met inside the core: nobody could leave and do better', () => {
    expect(stall.claim).toMatchObject({ who: 1, points: 45 });
    expect(stall.claim!.says).toContain('45');
    const [lo, hi] = coreRanges(stall)[1]!;
    expect(45).toBeGreaterThanOrEqual(lo);
    expect(45).toBeLessThanOrEqual(hi);
    expect(inCore(stall, [30, 45, 15])).toBe(true);
  });
});

describe('fair shares: the Shapley split', () => {
  it('lists all six orders in which three people can join', () => {
    expect(ORDERS).toHaveLength(6);
    expect(new Set(ORDERS.map((o) => o.join(''))).size).toBe(6);
  });

  it('what each adds on joining, in each order, sums to the whole', () => {
    for (const g of GAMES)
      for (const order of ORDERS) expect(addedIn(g, order).reduce((s, a) => s + a, 0)).toBe(worth(g, ALL));
  });

  it('in the order Asha, Bilal, Chitra, Asha adds 12, Bilal 60 and Chitra 18', () => {
    expect(addedIn(stall, [0, 1, 2])).toEqual([12, 60, 18]);
    expect(addedIn(stall, [2, 1, 0])).toEqual([66, 18, 6]);
  });

  it('gives the stall Asha 43, Bilal 31 and Chitra 16: the average of what each adds over the six orders', () => {
    expect(shapley(stall)).toEqual([43, 31, 16]);
    // Computed again, by hand-written orders.
    const v = (s: string) =>
      worth(
        stall,
        [...s].reduce((m, c) => m | (1 << 'ABC'.indexOf(c)), 0),
      );
    const asha = [v('A'), v('A'), v('AB') - v('B'), v('ABC') - v('BC'), v('AC') - v('C'), v('ABC') - v('BC')];
    expect(asha.reduce((s, a) => s + a, 0) / 6).toBe(43);
  });

  it('gives the cab Deepa 8, Esha 26 and Farid 56: each stretch of road shared by those who ride it', () => {
    expect(shapley(cab)).toEqual([8, 26, 56]);
    // The first 24 shared by three, the next 36 by two, the last 30 by Farid alone.
    expect([24 / 3, 24 / 3 + 36 / 2, 24 / 3 + 36 / 2 + 30]).toEqual([8, 26, 56]);
  });

  it('shares out the whole, in whole numbers, and lies in the core: nobody would leave', () => {
    for (const g of GAMES) {
      const s = shapley(g);
      expect(s.reduce((a, b) => a + b, 0)).toBe(worth(g, ALL));
      for (const x of s) expect(Number.isInteger(x)).toBe(true);
      expect(inCore(g, s)).toBe(true);
    }
  });

  it('is not the equal split, and not Bilal’s demand: he adds 31 on average, 14 less than he asks', () => {
    for (const g of GAMES) expect(shapley(g)).not.toEqual(equalSplit(g));
    expect(stall.claim!.points - shapley(stall)[1]!).toBe(14);
  });

  it('gives each person at least what they would get alone (in a cost game, never more than their own fare)', () => {
    for (const g of GAMES)
      shapley(g).forEach((x, i) => {
        const alone = worth(g, 1 << i);
        expect(g.kind === 'value' ? x >= alone : x <= alone).toBe(true);
      });
  });
});
