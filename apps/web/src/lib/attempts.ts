import type { GradedStep } from '@chaalwise/core/lesson';
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
  question: Pick<AttemptRecord, 'item' | 'chance' | 'confidence'> = {},
): Promise<void> {
  if (!skill) return;
  try {
    const progress = await openProgress();
    try {
      await progress.recordAttempt({ skill, outcome, at: new Date(), source, ...question });
    } finally {
      progress.close();
    }
  } catch (error) {
    console.error(error);
  }
}

/** The chance of getting a question right first time by guessing, so the profile can allow for it. */
export const guessChance = (step: GradedStep): number => (step.kind === 'choice' ? 1 / step.options.length : 0);
