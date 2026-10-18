import { describe, expect, it } from 'vitest';
import type { Lesson } from '@chaalwise/core/lesson';
import {
  chessLessonIssues,
  legalDests,
  parseMoveText,
  playUci,
  START,
  toSan,
  toUci,
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

describe('board helpers', () => {
  it('lists legal destinations for the side to move', () => {
    const dests = legalDests(START);
    expect(dests.get('e2')).toEqual(['e3', 'e4']);
    expect(dests.get('e7')).toBeUndefined();
  });

  it('plays a move and returns the new position', () => {
    expect(playUci(START, 'e2e4')).toBe(
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    );
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
