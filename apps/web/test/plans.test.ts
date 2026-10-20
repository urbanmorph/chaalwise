import { describe, expect, it } from 'vitest';
import { lessonsIn } from './content';

const lessons = lessonsIn('strategy').map(({ file, data }) => ({
  id: file.replace('.md', ''),
  steps: data.steps as { kind: string; situations?: string[]; alongside?: string; position?: string }[],
}));

describe('every strategy lesson ends with a plan to use the idea', () => {
  it('asks the learner when they will use it, with situations from work, study and home', () => {
    for (const { id, steps } of lessons) {
      const last = steps.at(-1)!;
      expect(last.kind, id).toBe('plan');
      expect(last.situations!.length, id).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('every strategy lesson compares its board with a case off it', () => {
  it('sets a work or study case beside the chess position, and asks what the two share', () => {
    for (const { id, steps } of lessons)
      expect(
        steps.some((s) => s.kind === 'choice' && s.alongside && s.position),
        id,
      ).toBe(true);
  });
});
