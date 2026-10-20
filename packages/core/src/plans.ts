/**
 * Plans to use an idea away from the board: an if-then sentence the learner
 * writes at the end of a strategy lesson, kept on the device, and a later
 * "did you use it?". If-then plans make people far more likely to act
 * (Gollwitzer and Sheeran 2006); asking afterwards closes the loop.
 */

export type CheckInResult = 'used' | 'forgot' | 'no-chance';

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

/** The plan to ask about now, the oldest first, or none. */
export function planToAsk(plans: readonly PlanRecord[], now: Date): PlanRecord | undefined {
  const ready = (p: PlanRecord) => {
    const last = p.checkIns.at(-1);
    if (p.checkIns.length >= MAX_CHECK_INS) return false;
    return now.getTime() - (last ? last.at.getTime() + 7 * DAY : p.createdAt.getTime() + DAY) >= 0;
  };
  return [...plans].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()).find(ready);
}
