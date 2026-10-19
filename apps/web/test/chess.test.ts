import { describe, expect, it } from 'vitest';
import type { Lesson } from '@chaalwise/core/lesson';
import {
  chessLessonIssues,
  EMPTY_BOARD,
  legalDests,
  parseMoveText,
  positionFromMoves,
  playUci,
  START,
  toFen,
  toSan,
  toUci,
  turnOf,
} from '../src/lib/chess';

const lesson = (steps: Lesson['steps']): Lesson => ({
  title: 't',
  summary: 's',
  game: 'chess',
  stage: 0,
  order: 1,
  skills: [],
  steps,
});
const move = (position: string, answers: string[]) =>
  lesson([{ kind: 'move', id: 'm', prompt: 'p', explanation: 'e', position, answers }]);

describe('chess lesson checks', () => {
  it('accepts a legal answer from a legal position', () => {
    expect(chessLessonIssues(move('start', ['e2e4', 'd2d4']))).toEqual([]);
  });

  it('reports a position that is not valid FEN', () => {
    expect(chessLessonIssues(move('not a fen', ['e2e4']))).toEqual([
      { path: ['steps', 0, 'position'], message: expect.stringMatching(/position/) },
    ]);
  });

  it('reports an answer that is not a legal move there', () => {
    expect(chessLessonIssues(move('start', ['e2e5']))).toEqual([
      { path: ['steps', 0, 'answers', 0], message: expect.stringMatching(/e2e5/) },
    ]);
  });

  it('requires answers in the form the board produces, so every answer can be played', () => {
    const castle = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';
    expect(chessLessonIssues(move(castle, ['e1h1']))).toEqual([
      { path: ['steps', 0, 'answers', 0], message: expect.stringMatching(/write it as e1g1/) },
    ]);
    expect(chessLessonIssues(move(castle, ['e1g1']))).toEqual([]);
  });

  it('checks the optional position on a choice step too', () => {
    const l = lesson([
      {
        kind: 'choice',
        id: 'c',
        prompt: 'p',
        explanation: 'e',
        options: ['a', 'b'],
        answer: 0,
        position: '8/8 w',
      },
    ]);
    expect(chessLessonIssues(l)).toHaveLength(1);
  });
});

describe('chess checks for square and play steps', () => {
  const play = (position: string, within = 10) =>
    lesson([
      {
        kind: 'play',
        id: 'p',
        prompt: 'p',
        explanation: 'e',
        position,
        goal: 'checkmate',
        within,
        opponent: 'lone-king',
      },
    ]);

  it('accepts a basic mate against a lone king', () => {
    expect(chessLessonIssues(play('8/8/8/4k3/8/8/8/4KQ2 w - - 0 1'))).toEqual([]);
  });

  it('rejects a play step where the computer has more than its king', () => {
    expect(chessLessonIssues(play('8/8/8/4k3/4p3/8/8/4KQ2 w - - 0 1'))[0]?.message).toMatch(/lone king/);
  });

  it('rejects a play step where it is the lone king to move', () => {
    expect(chessLessonIssues(play('8/8/8/4k3/8/8/8/4KQ2 b - - 0 1'))[0]?.message).toMatch(/learner to move/);
  });

  it('rejects a move limit below the known worst case (10 moves with a queen, 16 with a rook)', () => {
    expect(chessLessonIssues(play('8/8/8/4k3/8/8/8/4KQ2 w - - 0 1', 9))[0]?.message).toMatch(/at least 10/);
    expect(chessLessonIssues(play('8/8/8/4k3/8/8/8/4KR2 w - - 0 1', 16))).toEqual([]);
  });

  it('rejects material that cannot mate, and endings with no known move limit', () => {
    expect(chessLessonIssues(play('8/8/8/4k3/8/8/8/4KN2 w - - 0 1'))[0]?.message).toMatch(/cannot mate/);
    expect(chessLessonIssues(play('8/8/8/4k3/8/8/8/2B1KB2 w - - 0 1', 30))[0]?.message).toMatch(
      /no known move limit for KBBvK/,
    );
  });

  it('checks the position of a square step', () => {
    const l = lesson([
      { kind: 'square', id: 's', prompt: 'p', explanation: 'e', answers: ['e4'], position: 'nonsense' },
    ]);
    expect(chessLessonIssues(l)).toHaveLength(1);
  });
});

describe('positions written as moves', () => {
  it('plays standard notation from the start to a position', () => {
    expect(positionFromMoves('e4 e5 Nf3')).toBe('rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2');
  });

  it('lets a lesson write its position as moves from the start', () => {
    expect(toFen('moves: e4 e5 Nf3')).toBe(positionFromMoves('e4 e5 Nf3'));
    expect(chessLessonIssues(move('moves: e4 e5', ['g1f3']))).toEqual([]);
    expect(chessLessonIssues(move('moves: e4 e5 e5', ['g1f3']))[0]?.message).toMatch(/move 3/);
  });

  it('names the move that is not legal', () => {
    expect(() => positionFromMoves('e4 e5 Ke3')).toThrow(/move 3, Ke3/);
  });
});

describe('small board helpers', () => {
  it('reads the side to move from a position', () => {
    expect(turnOf(START)).toBe('white');
    expect(turnOf('4k3/8/8/8/8/8/8/4K3 b - - 0 1')).toBe('black');
  });

  it('has an empty board for square steps', () => {
    expect(EMPTY_BOARD.split(' ')[0]).toBe('8/8/8/8/8/8/8/8');
  });
});

describe('board helpers', () => {
  it('lists legal destinations for the side to move', () => {
    const dests = legalDests(START);
    expect(dests.get('e2')).toEqual(['e3', 'e4']);
    expect(dests.get('e7')).toBeUndefined();
  });

  it('plays a move and returns the new position', () => {
    expect(playUci(START, 'e2e4')).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1');
  });

  it('turns a board drag into a move, standard castling and auto-queen included', () => {
    const castle = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';
    expect(toUci(castle, 'e1', 'h1')).toBe('e1g1');
    expect(toUci(castle, 'e1', 'g1')).toBe('e1g1');
    expect(toUci('8/4P3/8/8/8/8/k7/7K w - - 0 1', 'e7', 'e8')).toBe('e7e8q');
    expect(toUci(START, 'g1', 'f3')).toBe('g1f3');
  });
});

describe('typed moves, for keyboard and screen-reader users', () => {
  it('reads standard notation and coordinates alike', () => {
    expect(parseMoveText(START, 'e4')).toBe('e2e4');
    expect(parseMoveText(START, 'Nf3')).toBe('g1f3');
    expect(parseMoveText(START, ' g1f3 ')).toBe('g1f3');
    expect(parseMoveText('4k3/8/8/3n4/8/8/8/3QK3 w - - 0 1', 'Qxd5')).toBe('d1d5');
  });

  it('keeps an under-promotion', () => {
    expect(parseMoveText('8/4P3/8/8/8/8/k7/7K w - - 0 1', 'e8=N')).toBe('e7e8n');
  });

  it('writes castling the standard way', () => {
    expect(parseMoveText('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', 'O-O')).toBe('e1g1');
    expect(parseMoveText('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', 'O-O-O')).toBe('e1c1');
  });

  it('accepts castling written with zeros', () => {
    expect(parseMoveText('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', '0-0')).toBe('e1g1');
    expect(parseMoveText('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', '0-0-0')).toBe('e1c1');
  });

  it('returns nothing for an illegal or unreadable move', () => {
    expect(parseMoveText(START, 'e5')).toBeUndefined();
    expect(parseMoveText(START, 'hello')).toBeUndefined();
    expect(parseMoveText(START, '')).toBeUndefined();
  });
});

describe('moves in words', () => {
  it('writes a move in standard notation for feedback', () => {
    expect(toSan(START, 'g1f3')).toBe('Nf3');
    expect(toSan('4k3/8/8/3n4/8/8/8/3QK3 w - - 0 1', 'd1d5')).toBe('Qxd5');
    expect(toSan('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', 'e1g1')).toBe('O-O');
  });
});
