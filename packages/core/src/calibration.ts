import type { Attempt } from './profile';

/**
 * Calibration: saying how sure you are before you answer, then seeing how often
 * you were right at each level. Short practice of this makes people's
 * confidence match their accuracy better (the Good Judgment Project's training;
 * Clearer Thinking's calibration trainer). It is shown, never graded.
 */
export const CONFIDENCE = [0.5, 0.7, 0.9] as const;

export interface CalibrationRow {
  confidence: number;
  answers: number;
  /** Right first time. */
  right: number;
}

export const calibration = (attempts: readonly Attempt[]): CalibrationRow[] =>
  CONFIDENCE.map((confidence) => {
    const said = attempts.filter((a) => a.confidence === confidence);
    return { confidence, answers: said.length, right: said.filter((a) => a.outcome === 'first-try').length };
  });
