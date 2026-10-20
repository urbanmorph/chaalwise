import type { GradedStep } from '@chaalwise/core/lesson';
import { describe, expect, it } from 'vitest';
import { contextOf, mixedIds } from '../src/lib/round-items';

const q = (measures: string): GradedStep => ({
  kind: 'choice',
  id: 'q',
  prompt: 'p',
  options: ['a', 'b'],
  answer: 0,
  explanation: 'e',
  measures,
});
const steps = Object.fromEntries([
  ...Array.from({ length: 10 }, (_, i) => [`ahead/${i}`, q('think-ahead')]),
  ...Array.from({ length: 3 }, (_, i) => [`calc/${i}`, q('calculation')]),
  ...Array.from({ length: 3 }, (_, i) => [`coop/${i}`, q('cooperate')]),
  ['board/0', q('board')],
]);
const track = (id: string) => id.split('/')[0];

describe('a mixed round', () => {
  it('deals questions from every track in turn, so no two in a row train the same idea', () => {
    const ids = mixedIds(steps, 6, () => 0.3);
    expect(ids).toHaveLength(6);
    for (let i = 1; i < ids.length; i++) expect(track(ids[i]!), ids.join()).not.toBe(track(ids[i - 1]!));
    expect(new Set(ids.map(track))).toEqual(new Set(['ahead', 'calc', 'coop']));
  });

  it('leaves out questions that train no strategy track, such as board sense', () => {
    expect(mixedIds(steps, 17, Math.random)).not.toContain('board/0');
  });

  it('never repeats a question', () => {
    const ids = mixedIds(steps, 16, Math.random);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('where a question comes from, shown when it is asked away from its lesson', () => {
  const choice = (fields: Partial<GradedStep> = {}) => ({ ...q('think-ahead'), ...fields }) as GradedStep;

  it('names the game for questions from game lessons and game reference entries', () => {
    expect(contextOf('chess/blunder-check/first-question', choice())).toBe('In chess');
    expect(contextOf('reference/chess/fork/find', choice())).toBe('In chess');
    expect(contextOf('reference/poker/outs/count', choice())).toBe('In poker');
  });

  it('names the lab for its debrief questions', () => {
    expect(contextOf('reference/labs/prisoners-dilemma/q1', choice())).toBe("In the Prisoner's Dilemma lab");
    expect(contextOf('reference/strategy/test-to-disprove/q1', choice())).toBe('In the Rule finder lab');
  });

  it('says chess for a strategy question on a board, and nothing for one about life off the board', () => {
    expect(contextOf('strategy/blunder-check/compare', choice({ position: 'start' } as Partial<GradedStep>))).toBe(
      'In chess',
    );
    expect(contextOf('strategy/blunder-check/angry-email', choice())).toBeUndefined();
    expect(contextOf('reference/strategy/sunk-cost/project', choice())).toBeUndefined();
  });
});
