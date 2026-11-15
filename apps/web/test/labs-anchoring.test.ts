import { describe, expect, it } from 'vitest';
import {
  aboveText,
  amount,
  anchorRounds,
  firstNumber,
  change,
  figure,
  ITEMS,
  pull,
  pullText,
  summarise,
  type Estimate,
} from '../src/lib/labs/anchoring';
import { seeded } from '../src/lib/labs/seeded';

const item = (id: string) => ITEMS.find((i) => i.id === id)!;

describe('first number wins?: the items', () => {
  it('has six items, two of each kind: rents, crowds at a fest and project times', () => {
    expect(ITEMS).toHaveLength(6);
    const kinds = ITEMS.map((i) => i.kind);
    for (const kind of ['rent', 'fest', 'project']) expect(kinds.filter((k) => k === kind)).toHaveLength(2);
  });

  it('uses as its value the middle of the range the item gives, so the value is worked from what the learner is told', () => {
    for (const i of ITEMS) {
      expect(i.value, i.id).toBe((i.range[0] + i.range[1]) / 2);
      expect(i.value % i.step, i.id).toBe(0);
    }
  });

  it('states each range in the text, in the item’s own terms', () => {
    for (const i of ITEMS.filter((i) => i.kind !== 'fest')) {
      expect(i.text, i.id).toContain(amount(i, i.range[0], true));
      expect(i.text, i.id).toContain(amount(i, i.range[1], true));
    }
    // A fest gives the students and the visitors per student; the range is their product.
    expect(item('fest-chennai').text).toContain('3,000 students');
    expect(item('fest-chennai').text).toContain('2 to 4 visitors for each student');
    expect(item('fest-chennai').range).toEqual([6000, 12000]);
    expect(item('fest-lucknow').text).toContain('2,000 students');
    expect(item('fest-lucknow').text).toContain('2 to 3 visitors for each student');
    expect(item('fest-lucknow').range).toEqual([4000, 6000]);
  });

  it('names a city in India and explains its terms, so each item stands alone', () => {
    for (const i of ITEMS) expect(i.text, i.id).toMatch(/Pune|Coimbatore|Chennai|Lucknow|Indore|Kolkata/);
    expect(item('rent-pune').text).toContain('two bedrooms, a hall and a kitchen');
    expect(item('fest-chennai').text).toContain('a college festival');
  });

  it('writes amounts the Indian way for a reader in India, and plain elsewhere, in rupees either way', () => {
    expect(amount(item('rent-pune'), 150000, true)).toBe('₹1,50,000');
    expect(amount(item('rent-pune'), 150000, false)).toBe('₹150,000');
    expect(amount(item('fest-chennai'), 16000, true)).toBe('16,000 visitors');
    expect(amount(item('project-website'), 1, true)).toBe('1 week');
    expect(amount(item('project-website'), 12, true)).toBe('12 weeks');
  });

  it('gives a bare figure for the debrief table, with its unit named once for the row', () => {
    expect(figure(item('rent-pune'), 27000, true)).toBe('₹27,000');
    expect(figure(item('fest-chennai'), 150000, true)).toBe('1,50,000');
    expect(figure(item('project-website'), 6, false)).toBe('6');
    expect(ITEMS.map((i) => i.unit)).toEqual([
      'rupees a month',
      'rupees a month',
      'visitors',
      'visitors',
      'weeks',
      'weeks',
    ]);
  });
});

describe('first number wins?: the first numbers', () => {
  it('gives each kind one high first number and one low, so half are high and half low', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const rounds = anchorRounds(seeded(seed));
      expect(rounds).toHaveLength(6);
      expect(rounds.filter((r) => r.side === 'high')).toHaveLength(3);
      for (const kind of ['rent', 'fest', 'project']) {
        const sides = rounds.filter((r) => r.item.kind === kind).map((r) => r.side);
        expect(sides.sort(), kind).toEqual(['high', 'low']);
      }
    }
  });

  it('cannot be gamed: which item is high changes from play to play, and so does how far off the number is', () => {
    const highs = new Set<string>();
    const ratios = new Set<number>();
    for (let seed = 1; seed <= 50; seed++)
      for (const r of anchorRounds(seeded(seed))) {
        if (r.side === 'high') highs.add(r.item.id);
        ratios.add(Math.round((r.anchor / r.item.value) * 100));
      }
    expect(highs.size).toBe(6);
    expect(ratios.size).toBeGreaterThan(10);
  });

  it('puts every first number outside the range the item gives, rounded as people say such numbers', () => {
    for (let seed = 1; seed <= 200; seed++)
      for (const { item: i, side, anchor } of anchorRounds(seeded(seed))) {
        if (side === 'high') expect(anchor, i.id).toBeGreaterThan(i.range[1]);
        else expect(anchor, i.id).toBeLessThan(i.range[0]);
        expect(anchor % i.step, i.id).toBe(0);
        expect(anchor).toBeGreaterThan(0);
      }
  });

  it('is the same for the same seed', () => {
    expect(anchorRounds(seeded(3))).toEqual(anchorRounds(seeded(3)));
  });

  it('comes from someone with a reason to want it high or low, a wheel, or a colleague who has not seen the plan', () => {
    const pune = item('rent-pune');
    expect(firstNumber({ item: pune, side: 'high', anchor: 48000 }, true)).toBe(
      'The owner speaks first: “I was thinking of ₹48,000 a month.”',
    );
    expect(firstNumber({ item: pune, side: 'low', anchor: 14000 }, true)).toBe(
      'The tenant speaks first: “I was thinking of ₹14,000 a month.”',
    );
    expect(firstNumber({ item: item('fest-lucknow'), side: 'low', anchor: 2500 }, true)).toBe(
      'Before you answer, a wheel of numbers is spun. It stops at 2,500.',
    );
    expect(firstNumber({ item: item('project-website'), side: 'high', anchor: 11 }, true)).toBe(
      'A colleague who has not seen the plan guesses 11 weeks.',
    );
  });
});

describe('first number wins?: the pull', () => {
  it('is how far an estimate moved from the value towards the first number, on a ratio scale', () => {
    expect(pull(100, 100, 200)).toBe(0);
    expect(pull(200, 100, 200)).toBeCloseTo(1);
    expect(pull(Math.sqrt(2) * 100, 100, 200)).toBeCloseTo(0.5);
    // The same for a low first number: halfway down from 100 to 50 is about 71.
    expect(pull(Math.sqrt(0.5) * 100, 100, 50)).toBeCloseTo(0.5);
    // Moving the other way is a negative pull.
    expect(pull(150, 100, 50)).toBeLessThan(0);
  });

  it('caps a wild estimate, such as a slip of a zero, so one typo cannot swamp the rest', () => {
    expect(pull(1_000_000, 100, 200)).toBe(2);
    expect(pull(1, 100, 200)).toBe(-1);
  });
});

describe('first number wins?: the summary', () => {
  const rows = (estimates: [id: string, side: 'high' | 'low', anchor: number, estimate: number][]): Estimate[] =>
    estimates.map(([id, side, anchor, estimate]) => ({ item: item(id), side, anchor, estimate }));

  it('is zero pull, and on the value either way, for someone who ignores the first numbers', () => {
    const s = summarise(
      rows([
        ['rent-pune', 'high', 50000, 27000],
        ['rent-coimbatore', 'low', 8000, 15000],
        ['fest-chennai', 'low', 4500, 9000],
        ['fest-lucknow', 'high', 9000, 5000],
        ['project-website', 'high', 11, 6],
        ['project-magazine', 'low', 5, 10],
      ]),
    );
    expect(s.pull).toBeCloseTo(0);
    expect(s.high).toBeCloseTo(0);
    expect(s.low).toBeCloseTo(0);
  });

  it('shows estimates moving with the first number: above the value after high ones, below after low ones', () => {
    const s = summarise(
      rows([
        ['rent-pune', 'high', 54000, 36000],
        ['rent-coimbatore', 'low', 7500, 12000],
        ['fest-chennai', 'low', 4500, 7000],
        ['fest-lucknow', 'high', 10000, 6500],
        ['project-website', 'high', 12, 8],
        ['project-magazine', 'low', 5, 8],
      ]),
    );
    expect(s.pull).toBeGreaterThan(0.2);
    expect(s.high).toBeGreaterThan(0.25);
    expect(s.low).toBeLessThan(-0.15);
  });

  it('averages the high and the low items as ratios to their values, so a large rent does not outweigh a short project', () => {
    const s = summarise(
      rows([
        ['rent-pune', 'high', 54000, 54000],
        ['project-website', 'high', 12, 6],
      ]),
    );
    // One estimate at twice the value and one on it: the geometric mean is √2, about 41% above.
    expect(s.high).toBeCloseTo(Math.SQRT2 - 1);
    expect(s.low).toBe(0);
  });
});

describe('first number wins?: before and after giving reasons', () => {
  it('calls a change of under 5 points of pull about the same', () => {
    expect(change(0.4, 0.2)).toBe('less');
    expect(change(0.2, 0.4)).toBe('more');
    expect(change(0.3, 0.27)).toBe('same');
  });

  it('says the pull in words, including when the learner moved away from the first number', () => {
    expect(pullText(0.34)).toBe('34% of the way towards the first number');
    expect(pullText(0)).toBe('not at all towards the first number');
    expect(pullText(-0.2)).toBe('away from the first number, by 20% of the gap');
    expect(aboveText(0.2)).toBe('20% above the lab’s value');
    expect(aboveText(-0.15)).toBe('15% below the lab’s value');
    expect(aboveText(0.001)).toBe('right on the lab’s value');
  });
});
