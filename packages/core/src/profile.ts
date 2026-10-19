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

/** Each level's bar: tries in all, share first time over the window, and different days. */
const BARS = {
  applying: { tries: 5, rate: 0.6, days: 1, text: 'at least 5 tries, and 6 in 10 first time' },
  reliable: { tries: 12, rate: 0.8, days: 2, text: 'at least 12 tries, 4 in 5 first time, on at least 2 days' },
  instinctive: { tries: 20, rate: 0.9, days: 3, text: 'at least 20 tries, 9 in 10 first time, on at least 3 days' },
} as const;

const NAMES: Record<Level, string> = {
  'not-started': 'Not started',
  noticing: 'Noticing',
  applying: 'Applying',
  reliable: 'Reliable',
  instinctive: 'Instinctive',
};
export const levelName = (level: Level) => NAMES[level];

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function assess(attempts: readonly Attempt[]): Assessment {
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
  const recent = [...attempts].sort((a, b) => a.at.getTime() - b.at.getTime()).slice(-WINDOW);
  const firstTry = recent.filter((a) => a.outcome === 'first-try').length;
  const total = recent.length;
  const days = new Set(recent.map((a) => a.at.toDateString())).size;
  const rate = firstTry / total;
  const meets = (bar: (typeof BARS)[keyof typeof BARS]) =>
    attempts.length >= bar.tries && rate >= bar.rate && days >= bar.days;

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
 * What to work on next: the weakest skill already started (ties go to the
 * lower first-time rate). Once every started skill is Reliable, the next skill
 * in the curriculum's order.
 */
export function nextFocus(profile: Readonly<Record<string, Assessment>>, order: readonly string[]): string | undefined {
  const started = order.filter((skill) => profile[skill] && profile[skill].level !== 'not-started');
  const weak = started
    .filter((skill) => rank(profile[skill]!) < LEVELS.indexOf('reliable'))
    .sort(
      (a, b) =>
        rank(profile[a]!) - rank(profile[b]!) ||
        profile[a]!.firstTry / profile[a]!.total - profile[b]!.firstTry / profile[b]!.total,
    );
  return (
    weak[0] ??
    order.find((skill) => !started.includes(skill)) ??
    started.sort((a, b) => rank(profile[a]!) - rank(profile[b]!))[0]
  );
}
