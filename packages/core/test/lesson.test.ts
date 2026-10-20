import { describe, expect, it } from 'vitest';
import { lessonSchema } from '../src/lesson';
import { lesson } from './fixtures';

describe('lessonSchema', () => {
  it('accepts a well-formed lesson', () => {
    expect(lessonSchema.parse(lesson)).toEqual(lesson);
  });

  it('rejects a choice whose answer is not one of its options', () => {
    const bad = structuredClone(lesson);
    bad.steps[1] = { ...bad.steps[1], answer: 2 } as (typeof bad.steps)[number];
    expect(() => lessonSchema.parse(bad)).toThrow(/answer/);
  });

  it('rejects two steps with the same id, because review cards are keyed by step id', () => {
    const bad = structuredClone(lesson);
    bad.steps[2] = { ...bad.steps[2]!, id: 'corner' };
    expect(() => lessonSchema.parse(bad)).toThrow(/duplicate step id/);
  });

  it('accepts a square step and a play-it-out step', () => {
    const steps = [
      { kind: 'square', id: 'find-e4', prompt: 'Find e4.', answers: ['e4'], explanation: 'File e, rank 4.' },
      {
        kind: 'play',
        id: 'mate-queen',
        prompt: 'Mate the lone king.',
        position: '8/8/8/4k3/8/8/8/4KQ2 w - - 0 1',
        goal: 'checkmate',
        within: 10,
        opponent: 'lone-king',
        explanation: 'Box the king in, then bring your own king.',
      },
    ];
    expect(lessonSchema.parse({ ...lesson, steps }).steps).toHaveLength(2);
  });

  it('lets a choice step highlight squares once the answer is shown', () => {
    const step = {
      kind: 'choice',
      id: 'c',
      prompt: 'p',
      options: ['a', 'b'],
      answer: 0,
      explanation: 'e',
      highlight: ['h1'],
    };
    expect(lessonSchema.parse({ ...lesson, steps: [step] }).steps[0]).toMatchObject({ highlight: ['h1'] });
    expect(() => lessonSchema.parse({ ...lesson, steps: [{ ...step, highlight: ['h9'] }] })).toThrow();
  });

  it('lets a choice say why each wrong option fails, one line per option', () => {
    const step = { kind: 'choice', id: 'c', prompt: 'p', options: ['a', 'b'], answer: 0, explanation: 'e' };
    expect(lessonSchema.parse({ ...lesson, steps: [{ ...step, feedback: ['', 'b misses the point.'] }] })).toBeTruthy();
    expect(() => lessonSchema.parse({ ...lesson, steps: [{ ...step, feedback: ['only one'] }] })).toThrow(/feedback/);
    // Every wrong option gets its reason; the right one needs none.
    expect(() => lessonSchema.parse({ ...lesson, steps: [{ ...step, feedback: ['', ''] }] })).toThrow(/feedback/);
  });

  it('lets a read step show a board with squares picked out, and a square step show coordinates', () => {
    const steps = [
      { kind: 'read', id: 'files', text: 'This is the e-file.', position: 'empty', highlight: ['e1', 'e2'] },
      {
        kind: 'square',
        id: 'pick',
        prompt: 'Click the e-file.',
        answers: ['e1', 'e2'],
        coordinates: true,
        explanation: 'e',
      },
    ];
    expect(lessonSchema.parse({ ...lesson, steps }).steps).toMatchObject(steps);
  });

  it('lets a move, square or play step name a practice generator for fresh positions', () => {
    const step = {
      kind: 'square',
      id: 'find',
      prompt: 'Find e4.',
      answers: ['e4'],
      explanation: 'e',
      practice: 'find-square',
    };
    expect(lessonSchema.parse({ ...lesson, steps: [step] }).steps[0]).toMatchObject({ practice: 'find-square' });
  });

  it('lets a lesson, or one of its steps, say which skill its answers give evidence for', () => {
    const step = {
      kind: 'choice',
      id: 'c',
      prompt: 'p',
      options: ['a', 'b'],
      answer: 0,
      explanation: 'e',
      measures: 'anticipation',
    };
    expect(lessonSchema.parse({ ...lesson, measures: 'safety', steps: [step] })).toMatchObject({
      measures: 'safety',
      steps: [{ measures: 'anticipation' }],
    });
  });

  it('rejects a square answer that is not a square', () => {
    const steps = [{ kind: 'square', id: 's', prompt: 'p', answers: ['e9'], explanation: 'e' }];
    expect(() => lessonSchema.parse({ ...lesson, steps })).toThrow();
  });

  it('accepts a strategy lesson that names its skill and the lesson it follows', () => {
    const strategy = { ...lesson, game: 'strategy', skills: ['think-ahead'], after: 'chess/blunder-check' };
    expect(lessonSchema.parse(strategy)).toMatchObject({ game: 'strategy', after: 'chess/blunder-check' });
  });

  it('requires a strategy lesson to say which lesson it follows, and which skill it trains', () => {
    expect(() => lessonSchema.parse({ ...lesson, game: 'strategy', skills: ['think-ahead'] })).toThrow(/after/);
    expect(() => lessonSchema.parse({ ...lesson, game: 'strategy', skills: [], after: 'chess/x' })).toThrow(/skill/);
  });

  it('rejects an unknown skill', () => {
    expect(() => lessonSchema.parse({ ...lesson, skills: ['juggling'] })).toThrow();
  });

  it('rejects a lesson with no steps', () => {
    expect(() => lessonSchema.parse({ ...lesson, steps: [] })).toThrow();
  });
});
