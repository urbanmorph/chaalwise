import { openProgress } from '@chaalwise/core/progress';

/**
 * Keep a learner's plan on this device: one per plan step, by its id (`<lesson>/<step>`, or
 * `labs/<slug>/plan` after a lab), so review asks "did you use it?" the same way for both.
 */
export async function keepPlan(id: string, track: string, text: string): Promise<void> {
  const progress = await openProgress();
  try {
    await progress.savePlan({ id, track, text, createdAt: new Date() });
  } finally {
    progress.close();
  }
}
