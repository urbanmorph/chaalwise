import { describe, expect, it } from 'vitest';
import { lessonSchema, questionSchema } from '../src/lesson';
import { authored } from './fixtures';

const choice = { kind: 'choice', prompt: 'p', options: ['a', 'b'], answer: 0, explanation: 'e' };

describe('a lesson', () => {
  it('accepts reading, a plan, and questions asked from the corpus by id', () => {
    expect(lessonSchema.parse(authored)).toEqual(authored);
  });

  it('keeps its questions in the corpus, never written into the lesson', () => {
    expect(() => lessonSchema.parse({ ...authored, steps: [{ ...choice, id: 'c' }] })).toThrow();
  });

  it('rejects two steps with the same id, and the same question asked twice', () => {
    expect(() => lessonSchema.parse({ ...authored, steps: [authored.steps[0], authored.steps[0]] })).toThrow(
      /duplicate/,
    );
    expect(() =>
      lessonSchema.parse({ ...authored, steps: [{ ask: 'chess/board/corner' }, { ask: 'chess/board/corner' }] }),
    ).toThrow(/duplicate/);
  });

  it('names a question by its place in the corpus', () => {
    expect(() => lessonSchema.parse({ ...authored, steps: [{ ask: 'Corner question' }] })).toThrow();
  });

  it('lets a read step draw arrows on its board, such as an attack', () => {
    const step = {
      kind: 'read',
      id: 'attack',
      text: 'The knight attacks the queen.',
      position: 'start',
      arrows: ['c3d1'],
    };
    expect(lessonSchema.parse({ ...authored, steps: [step] }).steps[0]).toMatchObject({ arrows: ['c3d1'] });
    expect(() => lessonSchema.parse({ ...authored, steps: [{ ...step, arrows: ['c3'] }] })).toThrow();
  });

  it('lets a read step show a board with squares picked out', () => {
    const step = { kind: 'read', id: 'files', text: 'This is the e-file.', position: 'empty', highlight: ['e1', 'e2'] };
    expect(lessonSchema.parse({ ...authored, steps: [step] }).steps[0]).toEqual(step);
  });

  it('accepts a strategy lesson that names its skill and the lesson it follows', () => {
    const strategy = { ...authored, game: 'strategy', skills: ['think-ahead'], after: 'chess/blunder-check' };
    expect(lessonSchema.parse(strategy)).toMatchObject({ game: 'strategy', after: 'chess/blunder-check' });
  });

  it('requires a strategy lesson to say which lesson it follows, and which skill it trains', () => {
    expect(() => lessonSchema.parse({ ...authored, game: 'strategy', skills: ['think-ahead'] })).toThrow(/after/);
    expect(() => lessonSchema.parse({ ...authored, game: 'strategy', skills: [], after: 'chess/x' })).toThrow(/skill/);
  });

  it('rejects an unknown skill, and a lesson with no steps', () => {
    expect(() => lessonSchema.parse({ ...authored, skills: ['juggling'] })).toThrow();
    expect(() => lessonSchema.parse({ ...authored, steps: [] })).toThrow();
  });
});

describe('poker lessons', () => {
  it('is a course of its own', () => {
    expect(lessonSchema.parse({ ...authored, game: 'poker' })).toMatchObject({ game: 'poker' });
  });

  it("shows cards instead of a board: your hand, the shared cards, others' hands, the pot and the price of a call", () => {
    const cards = {
      hole: ['As', 'Kd'],
      board: ['Qh', '7c', '2s'],
      others: [{ name: 'Bot', cards: ['9d', '9c'] }],
      pot: 12,
      toCall: 4,
    };
    expect(questionSchema.parse({ ...choice, cards })).toMatchObject({ cards });
    const read = { kind: 'read', id: 'hand', text: 'A pair of nines.', cards: { hole: ['9d', '9c'] } };
    expect(lessonSchema.parse({ ...authored, steps: [read] }).steps[0]).toMatchObject({
      cards: { hole: ['9d', '9c'] },
    });
  });

  it('writes a card as rank and suit, such as As or Td', () => {
    expect(() => questionSchema.parse({ ...choice, cards: { hole: ['A♠', 'Kd'] } })).toThrow();
    expect(() => questionSchema.parse({ ...choice, cards: { hole: ['1s', 'Kd'] } })).toThrow();
  });

  it('shows cards or a board, never both', () => {
    expect(() => questionSchema.parse({ ...choice, position: 'start', cards: { hole: ['As', 'Kd'] } })).toThrow(
      /board or cards/,
    );
  });
});

describe('a question in the corpus', () => {
  it('takes its id from its file, and may keep the review card it was saved under before', () => {
    expect(questionSchema.parse({ ...choice, card: 'strategy/blunder-check/angry-email' })).toMatchObject({
      card: 'strategy/blunder-check/angry-email',
    });
  });

  it('rejects a choice whose answer is not one of its options', () => {
    expect(() => questionSchema.parse({ ...choice, answer: 2 })).toThrow(/answer/);
  });

  it('accepts a square question and a play-it-out question', () => {
    expect(
      questionSchema.parse({ kind: 'square', prompt: 'Find e4.', answers: ['e4'], explanation: 'File e, rank 4.' }),
    ).toBeTruthy();
    const play = {
      kind: 'play',
      prompt: 'Mate the lone king.',
      position: '8/8/8/4k3/8/8/8/4KQ2 w - - 0 1',
      goal: 'checkmate',
      within: 10,
      opponent: 'lone-king',
      explanation: 'Box the king in, then bring your own king.',
    };
    expect(questionSchema.parse(play)).toMatchObject({ kind: 'play', within: 10 });
  });

  it('lets a choice highlight squares once the answer is shown', () => {
    expect(questionSchema.parse({ ...choice, highlight: ['h1'] })).toMatchObject({ highlight: ['h1'] });
    expect(() => questionSchema.parse({ ...choice, highlight: ['h9'] })).toThrow();
  });

  it('lets a choice say why each wrong option fails, one line per option', () => {
    expect(questionSchema.parse({ ...choice, feedback: ['', 'b misses the point.'] })).toBeTruthy();
    expect(() => questionSchema.parse({ ...choice, feedback: ['only one'] })).toThrow(/feedback/);
    // Every wrong option gets its reason; the right one needs none.
    expect(() => questionSchema.parse({ ...choice, feedback: ['', ''] })).toThrow(/feedback/);
  });

  it('lets a choice set a case off the board beside its board, to compare the two', () => {
    const compare = { ...choice, position: 'start', alongside: 'A client asks for a discount.' };
    expect(questionSchema.parse(compare)).toMatchObject({ alongside: 'A client asks for a discount.' });
    // There is nothing to compare without a board.
    expect(() => questionSchema.parse({ ...compare, position: undefined })).toThrow(/alongside/);
  });

  it('names a practice generator for fresh positions, and the skill its answers count towards', () => {
    const square = {
      kind: 'square',
      prompt: 'Find e4.',
      answers: ['e4'],
      explanation: 'e',
      practice: 'find-square',
      measures: 'board',
    };
    expect(questionSchema.parse(square)).toMatchObject({ practice: 'find-square', measures: 'board' });
  });

  it('rejects a square answer that is not a square, and anything that is not a question', () => {
    expect(() => questionSchema.parse({ kind: 'square', prompt: 'p', answers: ['e9'], explanation: 'e' })).toThrow();
    expect(() => questionSchema.parse({ kind: 'read', text: 'Just read.' })).toThrow();
  });
});
