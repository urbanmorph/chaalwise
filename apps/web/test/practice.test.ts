import { seeded } from '@chaalwise/teach/generate';
import { lessonSchema, type Lesson } from '@chaalwise/core/lesson';
import { describe, expect, it } from 'vitest';
import { chessLessonIssues } from '../src/lib/chess';
import { PRACTICE_KINDS, practiceStep } from '../src/lib/practice';

const asLesson = (steps: Lesson['steps']): Lesson => ({
  title: 't',
  summary: 's',
  game: 'chess',
  stage: 0,
  order: 1,
  skills: [],
  steps,
});

describe('practice steps in fresh positions', () => {
  it.each(PRACTICE_KINDS.flatMap((kind) => [1, 2, 3, 4, 5, 6, 7, 8].map((seed) => [kind, seed] as const)))(
    '%s, seed %i: a step that passes the same checks as a written lesson',
    (kind, seed) => {
      const step = practiceStep(kind, seeded(seed));
      const lesson = lessonSchema.parse(asLesson([step]));
      expect(chessLessonIssues(lesson)).toEqual([]);
      expect(step.kind).not.toBe('read');
    },
  );

  it('gives different positions for different seeds', () => {
    const a = practiceStep('win-hanging', seeded(1));
    const b = practiceStep('win-hanging', seeded(2));
    expect(a.kind === 'move' && b.kind === 'move' && a.position !== b.position).toBe(true);
  });

  it('rejects a lesson step that names a practice kind that does not exist', () => {
    const lesson = asLesson([
      { kind: 'square', id: 's', prompt: 'p', answers: ['e4'], explanation: 'e', practice: 'juggling' },
    ]);
    expect(chessLessonIssues(lesson)[0]?.message).toMatch(/no practice called juggling/);
  });
});
