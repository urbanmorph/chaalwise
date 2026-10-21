import type { Step } from '@chaalwise/core/lesson';
import { describe, expect, it } from 'vitest';
import { afterCheck } from '../src/lib/check-result';

const read = (id: string) => ({ kind: 'read', id, text: 'Read this.' }) as Step;
const ask = (id: string) =>
  ({ kind: 'choice', id, prompt: '?', options: ['a', 'b'], answer: 0, explanation: '.', measures: 'x' }) as Step;
const STEPS = [read('intro'), ask('q1'), read('more'), read('still'), ask('q2'), ask('q3')];

describe('after a check with a miss', () => {
  it('names the questions to work on by their step numbers', () => {
    const after = afterCheck(STEPS, { q1: 'first-try', q2: 'missed', q3: 'with-help' });
    expect(after).toMatchObject({ right: 1, total: 3, missed: [5, 6] });
  });

  it('starts at the reading before the first question missed', () => {
    expect(afterCheck(STEPS, { q1: 'first-try', q2: 'missed', q3: 'first-try' }).start).toBe(2);
    expect(afterCheck(STEPS, { q1: 'missed', q2: 'first-try', q3: 'first-try' }).start).toBe(0);
    expect(afterCheck(STEPS, { q1: 'first-try', q2: 'first-try', q3: 'missed' }).start).toBe(5);
  });
});
