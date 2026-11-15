import { verdict, type Score, type Setting, type SettingScore, type Verdict } from '@chaalwise/core/calibration-score';

/**
 * Calibration across settings: how sure the learner said they were, scored
 * against what happened, on the chessboard, at the poker table, in the labs and
 * in life. Training with a score improves forecasts (Chang and others 2016), but
 * it carries across settings only when people notice the same skill applies
 * (Babadimas and others 2019), so the round mixes settings and the progress page
 * shows each one. Loaded only by the round and the progress page's scores; the
 * round's questions are dealt in round-items.ts.
 */

export const SETTING_NAMES: Record<Setting, string> = {
  chess: 'Chess',
  poker: 'Poker',
  labs: 'Game-theory labs',
  life: 'Life: work, study and everyday',
};

/** Where, as the advice says it. */
export const WHERE: Record<Setting, string> = {
  chess: 'on chess questions',
  poker: 'on poker questions',
  labs: 'on game-theory lab questions',
  life: 'on life questions (work, study and everyday)',
};

const percent = (share: number) => `${Math.round(share * 100)}%`;

export const scoreLine = ({ brier, said, right }: Score) =>
  `Score ${brier.toFixed(2)}. You said ${percent(said)} sure on average and were right ${percent(right)} of the time.`;

export function advice(v: Verdict, where: string): string {
  if (v === 'overconfident')
    return `You are overconfident ${where}: you were right less often than you said. Slow down and look for what could make you wrong.`;
  if (v === 'underconfident')
    return `You are underconfident ${where}: you were right more often than you said. Once you have checked an answer, you can say you are surer.`;
  return `Your sureness matched your results ${where}. Keep asking yourself how sure you are.`;
}

/** Said only when the surest answers were right no more often than the least sure (see tellsApart). */
export const apart = (tells: boolean | undefined) =>
  tells === false
    ? 'Your surest answers were right no more often than your least sure ones. Before you pick, ask what you know that makes this one easier or harder.'
    : undefined;

/** Whether sureness carries across settings, once two have a score. */
export function across(rows: readonly SettingScore[]): string | undefined {
  const verdicts = rows.flatMap((r) => (r.score ? [verdict(r.score)] : []));
  if (verdicts.length < 2) return undefined;
  const [first] = verdicts;
  if (verdicts.some((v) => v !== first))
    return 'Your sureness does not carry across settings yet. Judging how sure to be is one skill, at the chessboard, at the poker table and at work: ask how sure you are wherever you make a guess.';
  if (first === 'matched') return 'Your sureness carries across settings: it matches your results in each one.';
  return `You are ${first} in every setting. The habit goes with you, so the fix can too.`;
}
