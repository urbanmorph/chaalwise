import type { Attempt } from './profile';
import { isRight, type CalibrationRow } from './calibration';

/**
 * Calibration scored: a Brier score, over- or underconfidence, whether the
 * surest answers are right more often, and a score for each setting. Kept apart
 * from calibration.ts, which every lesson page loads for its levels of sureness.
 */

/**
 * A run of answers scored: how many, the Brier score (the average of
 * (how sure − what happened)², with 1 for right first time and 0 otherwise;
 * 0 is perfect, always saying 50% scores 0.25), and how sure the learner said
 * they were against how often they were right, both as shares.
 */
export interface Score {
  answers: number;
  brier: number;
  said: number;
  right: number;
}

/** Answers where the learner said how sure they were. */
const sured = (attempts: readonly Attempt[]) =>
  attempts.filter((a): a is Attempt & { confidence: number } => a.confidence !== undefined);

const mean = (xs: readonly number[]) => xs.reduce((sum, x) => sum + x, 0) / xs.length;

export function score(attempts: readonly Attempt[]): Score | undefined {
  const scored = sured(attempts);
  if (!scored.length) return undefined;
  const happened = scored.map((a) => (isRight(a) ? 1 : 0));
  return {
    answers: scored.length,
    brier: mean(scored.map((a, i) => (a.confidence - happened[i]!) ** 2)),
    said: mean(scored.map((a) => a.confidence)),
    right: mean(happened),
  };
}

/** A gap of more than this many percentage points between how sure you said and how often you were right. */
const MARGIN = 10;

export type Verdict = 'overconfident' | 'underconfident' | 'matched';

/** Over- or underconfident: compared in whole percentage points, so 70% said and 80% right is a match. */
export function verdict({ said, right }: Score): Verdict {
  const gap = Math.round(said * 100) - Math.round(right * 100);
  return gap > MARGIN ? 'overconfident' : gap < -MARGIN ? 'underconfident' : 'matched';
}

/** Answers a level needs before it says anything about telling right from wrong. */
const LEVEL_MIN = 5;

/**
 * Whether your surest answers are right more often than your least sure ones
 * (discrimination, which feedback on overconfidence alone does not improve:
 * Stone and Opel 2000). Undefined until two levels each have enough answers.
 */
export function tellsApart(rows: readonly CalibrationRow[]): boolean | undefined {
  const used = rows.filter((r) => r.answers >= LEVEL_MIN);
  if (used.length < 2) return undefined;
  const rate = (r: CalibrationRow) => r.right / r.answers;
  return rate(used.at(-1)!) > rate(used[0]!);
}

/** Where a question is set: a chessboard, a poker table, a game-theory lab, or life off the board (work, study, everyday). */
export const SETTINGS = ['chess', 'poker', 'labs', 'life'] as const;
export type Setting = (typeof SETTINGS)[number];

/** Answers a setting needs before its score shows: fewer, and the score says more about luck than about you. */
export const MIN_ANSWERS = 10;

export interface SettingScore {
  setting: Setting;
  answers: number;
  /** Shown once there are MIN_ANSWERS answers. */
  score: Score | undefined;
}

/** A score for each setting, from the answers the learner said how sure they were of; `settingOf` places a question by its id. */
export function settingScores(
  attempts: readonly Attempt[],
  settingOf: (item: string | undefined) => Setting | undefined,
): SettingScore[] {
  const scored = sured(attempts);
  return SETTINGS.map((setting) => {
    const here = scored.filter((a) => settingOf(a.item) === setting);
    return { setting, answers: here.length, score: here.length >= MIN_ANSWERS ? score(here) : undefined };
  });
}
