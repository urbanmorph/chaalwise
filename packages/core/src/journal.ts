/**
 * The decision journal, kept on the device only: a decision written down
 * before it is made (what, what is expected, how sure, when to look back), and
 * short reflections after a lesson or lab. Looking back is judged against the
 * record made at the time, not memory, which hindsight rewrites once the result
 * is known (Chang et al. 2016: post-mortems from memory went with worse forecasts).
 */

/** The learner's judgement of a decision by what they knew, or could have found out, at the time. */
export type Judgement = 'sound' | 'unsound' | 'unsure';
export const JUDGEMENTS = ['sound', 'unsound', 'unsure'] as const satisfies readonly Judgement[];

export interface DecisionEntry {
  id: string;
  kind: 'decision';
  createdAt: Date;
  deciding: string;
  expect: string;
  /** How sure the learner was, as a percentage. */
  sure: number;
  lookBackOn: Date;
  lookedBack?: { at: Date; happened: string; judged: Judgement } | undefined;
}

/** "One thing you would do the same, one you would change", after a lesson or lab. */
export interface ReflectionEntry {
  id: string;
  kind: 'reflection';
  createdAt: Date;
  /** The lesson or lab, as `strategy/review-calmly` or `labs/nim`, and its title. */
  from: string;
  title: string;
  same: string;
  change: string;
}

export type JournalEntry = DecisionEntry | ReflectionEntry;

/** An entry's key on the device: its kind and when it was written. */
export const journalId = (kind: JournalEntry['kind'], now: Date) => `${kind}-${now.getTime()}`;

/** A date picker's `YYYY-MM-DD`, as the start of that day where the learner is. */
export function localDay(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y!, m! - 1, d);
}

/** The decision to look back on now, the earliest date first, or none. */
export function toLookBack(entries: readonly JournalEntry[], now: Date): DecisionEntry | undefined {
  return entries
    .filter((e): e is DecisionEntry => e.kind === 'decision' && !e.lookedBack && e.lookBackOn <= now)
    .sort((a, b) => a.lookBackOn.getTime() - b.lookBackOn.getTime())[0];
}
