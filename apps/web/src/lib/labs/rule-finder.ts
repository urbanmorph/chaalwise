import type { Random } from './seeded';

/**
 * The rule finder, after Wason's 2-4-6 task (1960): a hidden rule says yes or
 * no to any three numbers. The learner tests triples, then names the rule.
 * The lesson is in which triples they test: ones their own guess says should
 * fit, or ones it says should not.
 */
export type Triple = [number, number, number];

const isPrime = (n: number) => {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
};
const step =
  (by: number) =>
  ([a, b, c]: Triple) =>
    b - a === by && c - b === by;
const every = (test: (n: number) => boolean) => (t: Triple) => t.every(test);

export const RULES = {
  ascending: { text: 'Any three numbers going up', test: ([a, b, c]: Triple) => a < b && b < c },
  'up-by-2': { text: 'Numbers going up by 2', test: step(2) },
  'up-by-4': { text: 'Numbers going up by 4', test: step(4) },
  'up-by-10': { text: 'Numbers going up by 10', test: step(10) },
  'evenly-spaced': { text: 'Equal steps between them, up or down', test: ([a, b, c]: Triple) => b - a === c - b },
  'all-even': { text: 'All three numbers even', test: every((n) => n % 2 === 0) },
  'multiples-of-4': { text: 'All multiples of 4', test: every((n) => n % 4 === 0) },
  'multiples-of-10': { text: 'All multiples of 10', test: every((n) => n % 10 === 0) },
  'all-different': { text: 'Three different numbers', test: ([a, b, c]: Triple) => a !== b && b !== c && a !== c },
  primes: { text: 'All prime numbers', test: every(isPrime) },
  sum: { text: 'The third is the sum of the first two', test: ([a, b, c]: Triple) => a + b === c },
  'third-largest': { text: 'The third is the largest', test: ([a, b, c]: Triple) => c > a && c > b },
} satisfies Record<string, { text: string; test: (t: Triple) => boolean }>;

export type RuleId = keyof typeof RULES;

export interface Round {
  /** The rule that answers. */
  hidden: RuleId;
  /** The narrower rule the starting triple suggests. */
  trap: RuleId;
  /** A triple that fits both. */
  start: Triple;
  /** The five rules to choose from. */
  options: RuleId[];
  /** A test that would have shown the trap is wrong. */
  tell: Triple;
}

export const ROUNDS: Round[] = [
  {
    hidden: 'ascending',
    trap: 'up-by-2',
    start: [2, 4, 6],
    options: ['up-by-2', 'all-even', 'evenly-spaced', 'ascending', 'all-different'],
    tell: [1, 2, 3],
  },
  {
    hidden: 'all-even',
    trap: 'up-by-4',
    start: [4, 8, 12],
    options: ['up-by-4', 'multiples-of-4', 'all-even', 'ascending', 'evenly-spaced'],
    tell: [2, 10, 6],
  },
  {
    hidden: 'sum',
    trap: 'primes',
    start: [2, 3, 5],
    options: ['primes', 'ascending', 'all-different', 'third-largest', 'sum'],
    tell: [4, 6, 10],
  },
  {
    hidden: 'evenly-spaced',
    trap: 'multiples-of-10',
    start: [10, 20, 30],
    options: ['multiples-of-10', 'evenly-spaced', 'up-by-10', 'ascending', 'all-even'],
    tell: [3, 5, 7],
  },
];

/** Three rounds: the classic 2, 4, 6 first, then two of the others in a random order. */
export function drawRounds(random: Random): Round[] {
  const rest = ROUNDS.slice(1);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [rest[i], rest[j]] = [rest[j]!, rest[i]!];
  }
  return [ROUNDS[0]!, ...rest.slice(0, 2)];
}

/** Small triples, simplest first, to look for one that tells two rules apart. */
const SMALL: Triple[] = [];
for (let a = 1; a <= 10; a++) for (let b = 1; b <= 10; b++) for (let c = 1; c <= 20; c++) SMALL.push([a, b, c]);

/** A test that would have told the learner's pick from the hidden rule. */
export const telling = (round: Round, pick: RuleId): Triple =>
  pick === round.trap
    ? round.tell
    : (SMALL.find((t) => RULES[pick].test(t) !== RULES[round.hidden].test(t)) ?? round.tell);

/** A test your guess says should get a no: if it gets a yes, the guess is wrong. */
export const disconfirming = (guess: RuleId, t: Triple): boolean => !RULES[guess].test(t);

/** Three whole numbers, small enough to type. */
export const validTriple = (t: number[]): t is Triple =>
  t.length === 3 && t.every((n) => Number.isInteger(n) && Math.abs(n) <= 999);

export interface Played {
  hidden: RuleId;
  pick: RuleId;
  tests: { disconfirming: boolean }[];
}

/** Rules found, and how many tests could have proved the guess wrong. */
export function score(rounds: Played[]) {
  const tests = rounds.flatMap((r) => r.tests);
  return {
    found: rounds.filter((r) => r.pick === r.hidden).length,
    rounds: rounds.length,
    tests: tests.length,
    disconfirming: tests.filter((t) => t.disconfirming).length,
  };
}
