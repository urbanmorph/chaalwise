import type { GradedStep } from '@chaalwise/core/lesson';
import { describe, expect, it } from 'vitest';
import { guessChance } from '../src/lib/attempts';

describe('the chance of guessing a question', () => {
  it('is one in the number of options for multiple choice, and nothing for a move or a square', () => {
    const choice = {
      kind: 'choice',
      id: 'c',
      prompt: 'p',
      options: ['a', 'b', 'c'],
      answer: 0,
      explanation: 'e',
    } as GradedStep;
    expect(guessChance(choice)).toBeCloseTo(1 / 3);
    expect(
      guessChance({ kind: 'move', id: 'm', prompt: 'p', position: 'start', answers: ['e2e4'], explanation: 'e' }),
    ).toBe(0);
  });
});
