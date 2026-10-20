import type { GradedStep } from '@chaalwise/core/lesson';
import { isPracticeKind } from './practice-kinds';

export type RoundItem = { cardId: string; step: GradedStep };

/** The practice a step names, if its kind can have one. */
const practiceOf = (step: GradedStep) => ('practice' in step ? step.practice : undefined);

/**
 * The questions for a review or practice round. A question that names a
 * practice comes back as a fresh position of the same idea; the generators load
 * only when a round needs them.
 */
export async function roundItems(ids: string[], steps: Record<string, GradedStep>): Promise<RoundItem[]> {
  const needsPractice = ids.some((id) => practiceOf(steps[id]!));
  const { practiceStep } = needsPractice ? await import('./practice') : { practiceStep: undefined };
  return ids.map((cardId) => {
    const step = steps[cardId]!;
    const kind = practiceOf(step);
    const fresh =
      kind && isPracticeKind(kind) && practiceStep
        ? { ...practiceStep(kind, Math.random), measures: step.measures }
        : step;
    return { cardId, step: fresh };
  });
}
