import type { Outcome } from './player';

/**
 * The skill profile: a level per skill from the learner's own recent record,
 * never a rating, and never compared with anyone else. It is computed on the
 * device from attempts stored there.
 */

export const LEVELS = ['not-started', 'noticing', 'applying', 'reliable', 'instinctive'] as const;
export type Level = (typeof LEVELS)[number];

export interface Attempt {
  skill: string;
  outcome: Outcome;
  at: Date;
  /** The question answered, so a repeat on the same day counts once. Older records have none. */
  item?: string | undefined;
  /** The chance of getting it right first time by guessing: 1 in the number of options, 0 for a move. */
  chance?: number | undefined;
  /** How sure the learner said they were before answering (see calibration.ts). */
  confidence?: number | undefined;
}

export interface Assessment {
  level: Level;
  /** Over the recent window (the last 20 attempts). */
  firstTry: number;
  total: number;
  days: number;
  reason: string;
  /** What the next level needs, if there is one. */
  next: string | undefined;
}

const WINDOW = 20;

/**
 * Each level's bar: tries in all, share first time over the window (allowing
 * for guesses), different days and different questions.
 */
const BARS = {
  applying: { tries: 5, rate: 0.6, days: 1, items: 1, text: 'at least 5 tries, and 6 in 10 first time' },
  reliable: {
    tries: 12,
    rate: 0.8,
    days: 2,
    items: 8,
    text: 'at least 12 tries on 8 different questions, 4 in 5 first time, on at least 2 days',
  },
  instinctive: {
    tries: 20,
    rate: 0.9,
    days: 3,
    items: 12,
    text: 'at least 20 tries on 12 different questions, 9 in 10 first time, on at least 3 days',
  },
} as const;

const NAMES: Record<Level, string> = {
  'not-started': 'Not started',
  noticing: 'Noticing',
  applying: 'Applying',
  reliable: 'Reliable',
  // The id stays for stored records; answering questions shows fluency with an idea, not an instinct.
  instinctive: 'Fluent',
};
export const levelName = (level: Level) => NAMES[level];

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** One answer per question per day: the first. Answers with no question named all count. */
function oncePerDay(attempts: readonly Attempt[]): Attempt[] {
  const seen = new Set<string>();
  return [...attempts]
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .filter((a, i) => {
      const key = a.item ? `${a.item} ${a.at.toDateString()}` : `#${i}`;
      return !seen.has(key) && !!seen.add(key);
    });
}

/**
 * The share right first time, allowing for guesses (the usual correction for
 * multiple choice): a right answer scores 1, and a wrong one takes away what a
 * guess between the same options would have won.
 */
const guessCorrected = (attempts: readonly Attempt[]) =>
  Math.max(
    0,
    attempts.reduce((sum, a) => sum + (a.outcome === 'first-try' ? 1 : -(a.chance ?? 0) / (1 - (a.chance ?? 0))), 0) /
      attempts.length,
  );

export function assess(all: readonly Attempt[]): Assessment {
  const attempts = oncePerDay(all);
  if (!attempts.length) {
    return {
      level: 'not-started',
      firstTry: 0,
      total: 0,
      days: 0,
      reason: 'No tries yet.',
      next: 'Try a lesson or drill for this skill.',
    };
  }
  const recent = attempts.slice(-WINDOW);
  const firstTry = recent.filter((a) => a.outcome === 'first-try').length;
  const total = recent.length;
  const days = new Set(recent.map((a) => a.at.toDateString())).size;
  const rate = guessCorrected(recent);
  const items = new Set(attempts.map((a, i) => a.item ?? `#${i}`)).size;
  const meets = (bar: (typeof BARS)[keyof typeof BARS]) =>
    attempts.length >= bar.tries && rate >= bar.rate && days >= bar.days && items >= bar.items;

  const level: Level = meets(BARS.instinctive)
    ? 'instinctive'
    : meets(BARS.reliable)
      ? 'reliable'
      : meets(BARS.applying)
        ? 'applying'
        : 'noticing';
  const following = { noticing: 'applying', applying: 'reliable', reliable: 'instinctive' } as const;
  const up = level in following ? following[level as keyof typeof following] : undefined;
  return {
    level,
    firstTry,
    total,
    days,
    reason: `You got ${firstTry} of your last ${total} first time, over ${plural(days, 'day')}.`,
    next: up && `For ${NAMES[up]}: ${BARS[up].text}.`,
  };
}

const rank = (a: Assessment) => LEVELS.indexOf(a.level);

/**
 * Every skill in the order to work on it: the weak ones already started,
 * weakest first (ties go to the lower first-time rate); then the ones not
 * started, in the curriculum's order; then the Reliable and Fluent ones,
 * lowest first.
 */
export function focusOrder(profile: Readonly<Record<string, Assessment>>, order: readonly string[]): string[] {
  const level = (skill: string) => (profile[skill] ? rank(profile[skill]) : 0);
  const rate = (skill: string) => profile[skill]!.firstTry / profile[skill]!.total;
  const started = order.filter((skill) => level(skill) > 0);
  const weak = started.filter((skill) => level(skill) < LEVELS.indexOf('reliable'));
  return [
    ...weak.sort((a, b) => level(a) - level(b) || rate(a) - rate(b)),
    ...order.filter((skill) => level(skill) === 0),
    ...started.filter((skill) => !weak.includes(skill)).sort((a, b) => level(a) - level(b)),
  ];
}
