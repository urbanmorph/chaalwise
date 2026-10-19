import type { Outcome } from '@chaalwise/core/player';
import { openProgress, type AttemptRecord } from '@chaalwise/core/progress';

/**
 * Log one graded answer for the skill profile, on this device only. A failure
 * is logged and never interrupts the learner: the profile is a bonus, the
 * lesson is the point.
 */
export async function logAttempt(
  skill: string | undefined,
  outcome: Outcome,
  source: AttemptRecord['source'],
): Promise<void> {
  if (!skill) return;
  try {
    const progress = await openProgress();
    try {
      await progress.recordAttempt({ skill, outcome, at: new Date(), source });
    } finally {
      progress.close();
    }
  } catch (error) {
    console.error(error);
  }
}
