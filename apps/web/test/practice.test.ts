import { seeded } from '@chaalwise/teach/generate';
import { questionSchema } from '@chaalwise/core/lesson';
import { describe, expect, it } from 'vitest';
import { questionIssues } from '../src/lib/chess';
import { PRACTICE_KINDS, practiceStep } from '../src/lib/practice';

describe('practice steps in fresh positions', () => {
  it.each(PRACTICE_KINDS.flatMap((kind) => [1, 2, 3, 4, 5, 6, 7, 8].map((seed) => [kind, seed] as const)))(
    '%s, seed %i: a step that passes the same checks as a question in the corpus',
    (kind, seed) => {
      const step = practiceStep(kind, seeded(seed));
      expect(questionIssues(questionSchema.parse(step))).toEqual([]);
      expect(step.kind).not.toBe('read');
    },
  );

  it('gives different positions for different seeds', () => {
    const a = practiceStep('win-hanging', seeded(1));
    const b = practiceStep('win-hanging', seeded(2));
    expect(a.kind === 'move' && b.kind === 'move' && a.position !== b.position).toBe(true);
  });

  it('rejects a question that names a practice kind that does not exist', () => {
    const question = questionSchema.parse({
      kind: 'square',
      prompt: 'p',
      answers: ['e4'],
      explanation: 'e',
      practice: 'juggling',
    });
    expect(questionIssues(question)[0]?.message).toMatch(/no practice called juggling/);
  });
});
