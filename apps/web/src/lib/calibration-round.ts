import type { Setting } from '@chaalwise/core/calibration-score';
import type { GradedStep } from '@chaalwise/core/lesson';
import { deal } from './deal';
import { sourceOf } from './games';
import type { LabIndex } from './labs/lab-ref';

/**
 * The calibration round's questions, loaded with the round (CalibrationRound.svelte) only when a learner asks for one.
 * The progress page places review cards in settings with `settingOf` at build time.
 */

/** Where a question is set, for calibration by setting: its game, or life off the board (work, study, everyday). */
export function settingOf(cardId: string, step: GradedStep, labs: LabIndex): Setting {
  const { game } = sourceOf(cardId, step, labs);
  return game === 'chess' || game === 'poker' || game === 'labs' ? game : 'life';
}

/** Questions in a calibration round. */
export const CALIBRATION_ROUND = 10;

/**
 * A calibration round: questions with options (a sureness fits a pick among
 * options, not a move to find), that count towards a skill so the answer is
 * kept, dealt from each setting in turn.
 */
export function calibrationIds(
  steps: Record<string, GradedStep>,
  labs: LabIndex,
  count: number,
  random: () => number,
): string[] {
  const bySetting = new Map<Setting, string[]>();
  for (const [id, step] of Object.entries(steps)) {
    if (step.kind !== 'choice' || !step.measures) continue;
    const setting = settingOf(id, step, labs);
    bySetting.set(setting, [...(bySetting.get(setting) ?? []), id]);
  }
  return deal([...bySetting.values()], count, random);
}
