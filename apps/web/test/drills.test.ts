import { describe, expect, it } from 'vitest';
import { coordinateHint, randomSquare, safetyVerdict } from '../src/lib/drills';

describe('coordinates drill', () => {
  it('picks a square, never the same one twice in a row', () => {
    let seed = 1;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    let previous: string | undefined;
    for (let i = 0; i < 200; i++) {
      const square = randomSquare(random, previous);
      expect(square).toMatch(/^[a-h][1-8]$/);
      expect(square).not.toBe(previous);
      previous = square;
    }
  });

  it('says which way to look after a wrong pick, from the side the learner sits on', () => {
    expect(coordinateHint('e4', 'd4', 'white')).toBe('e4 is 1 file to the right of d4.');
    expect(coordinateHint('e4', 'e2', 'white')).toBe('e4 is 2 ranks up from e2.');
    expect(coordinateHint('e4', 'd4', 'black')).toBe('e4 is 1 file to the left of d4.');
    expect(coordinateHint('a1', 'c3', 'white')).toBe('a1 is 2 files to the left and 2 ranks down from c3.');
  });
});

describe('is this move safe? drill', () => {
  it('calls a safe move safe and says why', () => {
    expect(safetyVerdict('4k3/8/4p3/3n4/4P3/8/8/4K3 w - - 0 1', 'e4d5')).toEqual({
      safe: true,
      text: 'Safe. exd5 wins a knight, and after they take back you are still 2 points up.',
    });
  });

  it('calls an even trade safe', () => {
    // Nxd5 exd5: a knight for a knight.
    expect(safetyVerdict('4k3/8/4p3/3n4/8/2N5/8/4K3 w - - 0 1', 'c3d5')).toEqual({
      safe: true,
      text: 'Safe. Nxd5 is an even trade at worst.',
    });
  });

  it('says so when nothing can be won after a quiet move', () => {
    expect(safetyVerdict('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'g1f3')).toEqual({
      safe: true,
      text: 'Safe. After Nf3, nothing of yours can be won.',
    });
  });

  it('names what an unsafe move loses', () => {
    expect(safetyVerdict('4k3/8/4p3/8/8/8/8/3QK3 w - - 0 1', 'd1d5')).toEqual({
      safe: false,
      text: 'Not safe. After Qd5, they can win your queen on d5.',
    });
  });

  it('does not call castling a capture', () => {
    expect(safetyVerdict('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1', 'e1g1')).toEqual({
      safe: true,
      text: 'Safe. After O-O, nothing of yours can be won.',
    });
  });

  it('counts the pawn an en passant capture wins', () => {
    expect(safetyVerdict('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1', 'e5d6').text).toBe(
      'Safe. exd6 wins a pawn, and nothing of yours can then be won.',
    );
  });

  it('adds a note from the drill when there is more to say', () => {
    expect(safetyVerdict('4k3/8/4p3/8/8/8/8/3QK3 w - - 0 1', 'd1d5', 'And more.').text).toBe(
      'Not safe. After Qd5, they can win your queen on d5. And more.',
    );
  });

  it('names the mate an unsafe move allows', () => {
    expect(safetyVerdict('4r1k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1', 'd1d5')).toEqual({
      safe: false,
      text: 'Not safe. After Rd5, they mate with Re1#.',
    });
  });
});
