import type { GradedStep } from '@chaalwise/core/lesson';
import { describe, expect, it } from 'vitest';
import { askable, asMet, gamesMet, meetFirst, needs, workedExample } from '../src/lib/games';

const choice = (fields: Partial<GradedStep> = {}) =>
  ({ kind: 'choice', id: 'q', prompt: 'p', options: ['a', 'b'], answer: 0, explanation: 'e', ...fields }) as GradedStep;
const board = choice({ position: 'start' } as Partial<GradedStep>);

describe('which game a question needs', () => {
  it('needs chess for chess questions and strategy questions on a board, and nothing for life off the board', () => {
    expect(needs('chess/hanging/free-knight', choice())).toBe('chess');
    expect(needs('strategy/blunder-check/compare', board)).toBe('chess');
    expect(needs('strategy/blunder-check/angry-email', choice())).toBeUndefined();
    expect(needs('reference/strategy/sunk-cost/project', choice())).toBeUndefined();
  });

  it('needs the lab for a lab debrief question, and poker for a poker question', () => {
    expect(needs('reference/labs/prisoners-dilemma/repeat', choice())).toBe('labs/prisoners-dilemma');
    expect(needs('reference/strategy/test-to-disprove/two-four-six', choice())).toBe('labs/rule-finder');
    expect(needs('poker/outs/count', choice())).toBe('poker');
  });
});

describe('the games a learner has met, from what is done on this device', () => {
  it('meets chess with any chess lesson, the first moves, or a passed check; and a lab by playing it', () => {
    expect(gamesMet(new Set())).toEqual(new Set());
    expect(gamesMet(new Set(['chess/first-moves']))).toEqual(new Set(['chess']));
    expect(gamesMet(new Set(['chess/fork', 'strategy/blunder-check']))).toEqual(new Set(['chess']));
    expect(gamesMet(new Set(['labs/nim']))).toEqual(new Set(['labs/nim']));
  });

  it('asks a question only once its game is met; life questions always', () => {
    const met = gamesMet(new Set(['labs/nim']));
    expect(askable('chess/hanging/free-knight', choice(), met)).toBe(false);
    expect(askable('reference/labs/backward-induction/nim-eleven', choice(), met)).toBe(true);
    expect(askable('strategy/blunder-check/angry-email', choice(), met)).toBe(true);
  });
});

describe('a worked example, for a board question before chess is met', () => {
  it('shows a move question as the position with the move played for you, and why', () => {
    const move = {
      kind: 'move',
      id: 'strategy/x/find',
      prompt: 'Find the fork.',
      position: '6k1/8/8/3N4/8/8/8/6K1 w - - 0 1',
      answers: ['d5e7'],
      explanation: 'It checks the king and hits the rook.',
    } as GradedStep;
    const worked = workedExample(move);
    expect(worked).toMatchObject({
      kind: 'read',
      id: 'strategy/x/find',
      position: move.position,
      arrows: ['d5e7'],
    });
    expect(worked.text).toBe('Worked example. Find the fork. The move is Ne7+. It checks the king and hits the rook.');
  });

  it('shows a choice with its answer, and the case off the board beside it', () => {
    const worked = workedExample({
      ...board,
      prompt: 'What do they share?',
      options: ['A', 'B'],
      answer: 1,
      explanation: 'Because.',
      alongside: 'A client asks for a discount.',
    } as GradedStep);
    expect(worked.text).toBe(
      'Worked example. Off the board: A client asks for a discount. What do they share? The answer: “B”. Because.',
    );
  });

  it('keeps a choice question’s arrows on its worked example', () => {
    expect(workedExample({ ...board, arrows: ['c3d1'] } as GradedStep)).toMatchObject({ arrows: ['c3d1'] });
  });
});

describe('meet the game first, in a strategy lesson', () => {
  const life = choice({ id: 'life/x/y' });
  const chessQ = choice({ id: 'chess/x/compare', position: 'start' } as Partial<GradedStep>);
  const pokerQ = choice({ id: 'poker/outs/count', cards: { hole: ['As', 'Kd'] } } as Partial<GradedStep>);
  const labQ = choice({ id: 'labs/prisoners-dilemma/repeat' });
  const read = { kind: 'read', id: 'r', text: 't' } as const;

  it('turns chess and poker questions into worked examples, and the lab it follows; never in a game lesson', () => {
    const steps = [read, life, chessQ, pokerQ, labQ];
    expect(meetFirst({ game: 'strategy', after: 'poker/outs-and-odds' }, steps)).toEqual(['chess', 'poker']);
    expect(meetFirst({ game: 'strategy', after: 'labs/prisoners-dilemma' }, steps)).toEqual([
      'chess',
      'poker',
      'labs/prisoners-dilemma',
    ]);
    expect(meetFirst({ game: 'strategy', after: 'chess/fork' }, [read, life])).toEqual([]);
    expect(meetFirst({ game: 'poker' }, steps)).toEqual([]);
  });

  it('shows a question as a worked example until its game is met; reading and life questions as they are', () => {
    const steps = [read, life, chessQ, pokerQ, labQ];
    const games = ['chess', 'poker', 'labs/prisoners-dilemma'];
    const fresh = asMet(steps, games, new Set());
    expect(fresh.map((s) => s.kind)).toEqual(['read', 'choice', 'read', 'read', 'read']);
    expect(asMet(steps, games, new Set(['poker']))[3]).toBe(pokerQ);
    expect(asMet(steps, games, new Set(['labs/prisoners-dilemma']))[4]).toBe(labQ);
    expect(asMet(steps, ['chess'], new Set())[3]).toBe(pokerQ);
  });

  it('keeps a poker question’s cards on its worked example, with the case set away from the table', () => {
    const worked = workedExample({ ...pokerQ, alongside: 'A shop offers a bulk deal.' } as GradedStep);
    expect(worked).toMatchObject({ kind: 'read', cards: { hole: ['As', 'Kd'] } });
    expect(worked.text).toContain('Away from the table: A shop offers a bulk deal.');
  });
});
