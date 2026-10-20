import { describe, expect, it } from 'vitest';
import { corpus } from './content';

/**
 * Multiple choice teaches only when every option has to be thought about:
 * each wrong option is a tempting mistake with its own reason, and nothing on
 * the surface gives the answer away.
 */
type Choice = { kind: 'choice'; id: string; options: string[]; answer: number; feedback?: string[] };

// Every question lives in the corpus, so the corpus is the whole set.
const choices = [...corpus]
  .filter(([, data]) => data.kind === 'choice')
  .map(([id, data]) => ({ where: id, step: data as unknown as Choice }));

describe('every multiple-choice question', () => {
  it('exists in numbers worth checking', () => {
    expect(choices.length).toBeGreaterThan(40);
  });

  it('says why each wrong option fails', () => {
    const missing = choices.filter(({ step }) => !step.feedback).map((c) => c.where);
    expect(missing).toEqual([]);
  });

  it('does not give the answer away by being much longer than every wrong option', () => {
    const giveaways = choices
      .filter(({ step }) => {
        const right = step.options[step.answer]!.length;
        const longestWrong = Math.max(...step.options.filter((_, i) => i !== step.answer).map((o) => o.length));
        return right > longestWrong * 1.6 && right - longestWrong > 15;
      })
      .map((c) => c.where);
    expect(giveaways).toEqual([]);
  });
});
