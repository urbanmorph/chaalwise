import { describe, expect, it } from 'vitest';
import {
  disconfirming,
  drawRounds,
  telling,
  ROUNDS,
  RULES,
  score,
  validTriple,
  type Triple,
} from '../src/lib/labs/rule-finder';
import { seeded } from '../src/lib/labs/seeded';

/** Small whole numbers, enough to tell any two candidate rules apart. */
const SPACE: Triple[] = [];
for (let a = -3; a <= 12; a++) for (let b = -3; b <= 12; b++) for (let c = -3; c <= 24; c++) SPACE.push([a, b, c]);

describe('the rules', () => {
  const fits = (id: keyof typeof RULES, t: Triple) => RULES[id].test(t);

  it('say yes or no to a triple as their words say', () => {
    expect(fits('ascending', [1, 2, 30])).toBe(true);
    expect(fits('ascending', [3, 2, 1])).toBe(false);
    expect(fits('ascending', [2, 2, 3])).toBe(false);
    expect(fits('up-by-2', [7, 9, 11])).toBe(true);
    expect(fits('up-by-2', [1, 2, 3])).toBe(false);
    expect(fits('all-even', [8, 2, 0])).toBe(true);
    expect(fits('all-even', [2, 4, 5])).toBe(false);
    expect(fits('sum', [-1, 5, 4])).toBe(true);
    expect(fits('sum', [2, 3, 6])).toBe(false);
    expect(fits('primes', [2, 3, 5])).toBe(true);
    expect(fits('primes', [1, 3, 5])).toBe(false);
    expect(fits('primes', [-2, 3, 5])).toBe(false);
    expect(fits('evenly-spaced', [9, 6, 3])).toBe(true);
    expect(fits('evenly-spaced', [1, 2, 4])).toBe(false);
    expect(fits('multiples-of-10', [0, 50, 20])).toBe(true);
  });
});

describe('the rounds', () => {
  it('start with a triple that fits both the hidden rule and a narrower, tempting one', () => {
    for (const round of ROUNDS) {
      expect(round.hidden).not.toBe(round.trap);
      expect(RULES[round.hidden].test(round.start), round.hidden).toBe(true);
      expect(RULES[round.trap].test(round.start), round.trap).toBe(true);
    }
  });

  it('offer five candidate rules, the trap and the true one among them, each one a test can rule out', () => {
    for (const round of ROUNDS) {
      expect(round.options).toHaveLength(5);
      expect(new Set(round.options).size).toBe(5);
      expect(round.options).toContain(round.hidden);
      expect(round.options).toContain(round.trap);
      for (const id of round.options.filter((o) => o !== round.hidden)) {
        const telling = SPACE.find((t) => RULES[id].test(t) !== RULES[round.hidden].test(t));
        expect(telling, `${round.hidden} vs ${id}`).toBeDefined();
      }
    }
  });

  it('each name a test that would have shown the trap is wrong', () => {
    for (const round of ROUNDS) {
      expect(RULES[round.hidden].test(round.tell)).toBe(true);
      expect(RULES[round.trap].test(round.tell)).toBe(false);
    }
  });

  it('are three, all different, starting with the classic 2, 4, 6', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const rounds = drawRounds(seeded(seed));
      expect(rounds).toHaveLength(3);
      expect(new Set(rounds.map((r) => r.hidden)).size).toBe(3);
      expect(rounds[0]!.start).toEqual([2, 4, 6]);
      expect(rounds[0]!.hidden).toBe('ascending');
    }
  });
});

describe('after a wrong answer', () => {
  it("names a test that tells the pick from the true rule: the round's own one for the trap", () => {
    for (const round of ROUNDS) {
      expect(telling(round, round.trap)).toEqual(round.tell);
      for (const pick of round.options.filter((o) => o !== round.hidden)) {
        const t = telling(round, pick);
        expect(RULES[pick].test(t), pick).not.toBe(RULES[round.hidden].test(t));
      }
    }
  });
});

describe('testing a guess', () => {
  it('a test is disconfirming when your own guess says it should get a no', () => {
    expect(disconfirming('up-by-2', [1, 2, 3])).toBe(true);
    expect(disconfirming('up-by-2', [10, 12, 14])).toBe(false);
  });

  it('takes three whole numbers from -999 to 999', () => {
    expect(validTriple([1, 2, 3])).toBe(true);
    expect(validTriple([1, 2.5, 3])).toBe(false);
    expect(validTriple([1, Number.NaN, 3])).toBe(false);
    expect(validTriple([1, 2, 1000])).toBe(false);
  });

  it('scores rules found and the share of tests that could have proved the guess wrong', () => {
    const result = score([
      { hidden: 'ascending', pick: 'up-by-2', tests: [{ disconfirming: false }, { disconfirming: false }] },
      { hidden: 'sum', pick: 'sum', tests: [{ disconfirming: true }, { disconfirming: false }] },
    ]);
    expect(result).toEqual({ found: 1, rounds: 2, tests: 4, disconfirming: 1 });
  });
});
