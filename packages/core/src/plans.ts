/**
 * Plans to use an idea away from the board: an if-then sentence the learner
 * writes at the end of a strategy lesson, kept on the device, and a later
 * "did you use it?". If-then plans make people far more likely to act
 * (Gollwitzer and Sheeran 2006); asking afterwards closes the loop.
 */

/**
 * A check-in asks first whether the moment came and was noticed (missing it is the
 * usual failure: Babadimas et al. 2019), then whether the plan was acted on.
 * `noticed` is noticed but not acted on. Earlier check-ins asked only "did you
 * use it?" and are kept as they were: `used` and `forgot`.
 */
export const CHECK_IN_RESULTS = ['acted', 'noticed', 'not-noticed', 'no-chance', 'used', 'forgot'] as const;
export type CheckInResult = (typeof CHECK_IN_RESULTS)[number];

export interface PlanRecord {
  /** The plan step, as `strategy/blunder-check/plan`: one plan per step, rewritten in place. */
  id: string;
  track: string;
  text: string;
  createdAt: Date;
  checkIns: { at: Date; result: CheckInResult }[];
}

const DAY = 86_400_000;
/** Ask a day after the plan is made, then a week after each answer, at most this many times. */
const MAX_CHECK_INS = 3;

const clean = (text: string) => text.trim().replace(/[.\s]+$/, '');

/** "When <situation>, <action>." */
export const planSentence = (situation: string, action: string) => `When ${clean(situation)}, ${clean(action)}.`;

/** A plan sentence split back into its "When …" part and its action, or none if it is not one. */
export function splitPlan(text: string): { situation: string; action: string } | undefined {
  const parts = /^When (.+), (I will .+?)\.?$/.exec(text);
  return parts ? { situation: parts[1]!, action: parts[2]! } : undefined;
}

/** The plan to ask about now, the oldest first, or none. */
export function planToAsk(plans: readonly PlanRecord[], now: Date): PlanRecord | undefined {
  const ready = (p: PlanRecord) => {
    const last = p.checkIns.at(-1);
    if (p.checkIns.length >= MAX_CHECK_INS) return false;
    return now.getTime() - (last ? last.at.getTime() + 7 * DAY : p.createdAt.getTime() + DAY) >= 0;
  };
  return [...plans].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()).find(ready);
}
