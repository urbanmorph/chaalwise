import type { Lesson, Step } from '../src/lesson';

/** A lesson as written: reading, and questions asked from the corpus by id. */
export const authored: Lesson = {
  title: 'A sample lesson',
  summary: 'One of each step.',
  game: 'chess',
  stage: 0,
  order: 1,
  skills: ['think-ahead'],
  steps: [
    { kind: 'read', id: 'intro', text: 'Read this first.' },
    { ask: 'chess/board/corner' },
    { ask: 'chess/board/push' },
  ],
};

/** The same lesson as played: its questions looked up. Positions are opaque strings to core. */
export const lesson: { steps: Step[] } = {
  steps: [
    { kind: 'read', id: 'intro', text: 'Read this first.' },
    {
      kind: 'choice',
      id: 'corner',
      prompt: 'Which corner is light?',
      options: ['a1', 'h1'],
      answer: 1,
      explanation: 'Light on right.',
    },
    {
      kind: 'move',
      id: 'push',
      prompt: 'Push the king pawn two squares.',
      position: 'start',
      answers: ['e2e4'],
      hint: 'The pawn in front of the king.',
      explanation: 'It opens lines for the queen and bishop.',
    },
  ],
};
