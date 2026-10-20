import { describe, expect, it } from 'vitest';
import { lessonSchema } from '../src/lesson';
import { advance, createPlayer, giveUp } from '../src/player';
import { planSentence, planToAsk, type PlanRecord } from '../src/plans';
import { authored, lesson } from './fixtures';

const day = 86_400_000;
const now = new Date('2026-10-20T09:00:00Z');
const ago = (days: number) => new Date(now.getTime() - days * day);
const plan = (fields: Partial<PlanRecord> = {}): PlanRecord => ({
  id: 'strategy/blunder-check/plan',
  track: 'think-ahead',
  text: 'When I am about to send an important email, I will ask what it lets them do.',
  createdAt: ago(2),
  checkIns: [],
  ...fields,
});

const step = {
  kind: 'plan',
  id: 'plan',
  prompt: 'When will you use it this week?',
  situations: ['I am about to send an important email', 'I agree to a deadline'],
  action: 'I will ask what it lets the other side do',
};

describe('a plan to use the idea', () => {
  it('is a lesson step with situations to choose from and the action to take', () => {
    expect(lessonSchema.parse({ ...authored, steps: [step] }).steps[0]).toMatchObject({ kind: 'plan' });
    expect(() => lessonSchema.parse({ ...authored, steps: [{ ...step, situations: ['only one'] }] })).toThrow();
  });

  it('is not graded: the learner moves on without answering, and it cannot be given up', () => {
    const steps = { steps: [step, lesson.steps[1]!] } as typeof lesson;
    expect(giveUp(steps, createPlayer())).toEqual(createPlayer());
    expect(advance(steps, createPlayer()).index).toBe(1);
  });

  it('reads as one if-then sentence', () => {
    expect(planSentence('I am about to send an important email', 'I will ask what it lets them do')).toBe(
      'When I am about to send an important email, I will ask what it lets them do.',
    );
    expect(planSentence(' I agree to a deadline. ', 'I will count it through.')).toBe(
      'When I agree to a deadline, I will count it through.',
    );
  });
});

describe('asking whether a plan was used', () => {
  it('waits a day after the plan is made', () => {
    expect(planToAsk([plan({ createdAt: ago(0.5) })], now)).toBeUndefined();
    expect(planToAsk([plan()], now)?.id).toBe('strategy/blunder-check/plan');
  });

  it('asks again a week after the last answer, three times at most', () => {
    expect(planToAsk([plan({ checkIns: [{ at: ago(3), result: 'forgot' }] })], now)).toBeUndefined();
    expect(planToAsk([plan({ checkIns: [{ at: ago(8), result: 'forgot' }] })], now)).toBeDefined();
    const three = [8, 16, 24].map((d) => ({ at: ago(d), result: 'used' as const }));
    expect(planToAsk([plan({ checkIns: three })], now)).toBeUndefined();
  });

  it('asks about the oldest plan first', () => {
    const older = plan({ id: 'a', createdAt: ago(5) });
    expect(planToAsk([plan({ id: 'b' }), older], now)?.id).toBe('a');
  });
});
