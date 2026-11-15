import type { Outcome } from './player';

/**
 * A case a week later: a week after a learner finishes a lesson, review offers
 * a short new case that does not say which idea it tests. Afterwards it names
 * the idea and says whether the learner used it. Checks that do not announce
 * their idea measure transfer honestly (Sellier and others 2019), and people
 * often fail to use an idea because they do not notice it applies. The result
 * stays on the device.
 */

export interface LaterRecord {
  /** The case, as `later/the-tea-stall`. */
  caseId: string;
  /** The lesson or lab whose idea it tested, as `strategy/blunder-check`. */
  idea: string;
  /** Every decision right first time. */
  used: boolean;
  /** Decisions right first time, of how many. */
  right: number;
  of: number;
  at: Date;
}

const DAY = 86_400_000;
/** Days from finishing a lesson to its case. */
export const LATER_DAYS = 7;

/** The case to offer now, its idea finished longest ago first, or none: one a week after its idea, and each case once. */
export function caseToOffer<C extends { id: string; idea: string }>(
  cases: readonly C[],
  finished: readonly { lessonId: string; completedAt: Date }[],
  done: readonly Pick<LaterRecord, 'caseId'>[],
  now: Date,
): C | undefined {
  const taken = new Set(done.map((d) => d.caseId));
  const when = new Map(finished.map((f) => [f.lessonId, f.completedAt.getTime()]));
  return cases
    .filter((c) => !taken.has(c.id) && now.getTime() - (when.get(c.idea) ?? Infinity) >= LATER_DAYS * DAY)
    .sort((a, b) => when.get(a.idea)! - when.get(b.idea)!)[0];
}

/** Whether a case's answers used its idea: every decision right first time. */
export function usedIdea(outcomes: Record<string, Outcome>): Pick<LaterRecord, 'used' | 'right' | 'of'> {
  const all = Object.values(outcomes);
  const right = all.filter((o) => o === 'first-try').length;
  return { used: all.length > 0 && right === all.length, right, of: all.length };
}

/** How many cases used their idea unprompted, of how many done. */
export const usedShare = (records: readonly Pick<LaterRecord, 'used'>[]): { used: number; of: number } => ({
  used: records.filter((r) => r.used).length,
  of: records.length,
});
