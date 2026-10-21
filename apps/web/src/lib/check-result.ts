import type { Step } from '@chaalwise/core/lesson';
import { isGraded, type Outcome } from '@chaalwise/core/player';

/**
 * After a check with a miss: how it went, the step numbers of the questions to
 * work on, and where the lesson starts: the reading just before the first of
 * them, so the learner is not sent back through what they already know.
 */
export function afterCheck(steps: Step[], result: Record<string, Outcome>) {
  const graded = steps.filter((s) => s.id in result);
  const missed = steps.flatMap((s, i) => (s.id in result && result[s.id] !== 'first-try' ? [i + 1] : []));
  let start = (missed[0] ?? 1) - 1;
  while (start > 0 && !isGraded(steps[start - 1]!)) start--;
  return { right: graded.length - missed.length, total: graded.length, missed, start };
}
