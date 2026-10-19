import { describe, expect, it } from 'vitest';
import { winningCaptures } from '../src/captures';
import { kingMoves, materialSignature } from '../src/endgame';
import { hangingPosition, loosePosition, mateStart, pieceSquares, seeded } from '../src/generate';
import { loosePieces } from '../src/hanging';
import { fromFen, legalMoves } from '../src/position';

const SEEDS = Array.from({ length: 60 }, (_, i) => i + 1);

describe('a seeded random source', () => {
  it('repeats for the same seed and stays in [0, 1)', () => {
    const a = seeded(42);
    const b = seeded(42);
    for (let i = 0; i < 100; i++) {
      const x = a();
      expect(x).toBe(b());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
});

describe('where can this piece go?', () => {
  it.each(SEEDS)('seed %i: a legal position, and every listed square is a legal destination of the piece', (seed) => {
    const drill = pieceSquares(seeded(seed));
    const pos = fromFen(drill.fen);
    const fromPiece = legalMoves(pos)
      .filter((m) => m.startsWith(drill.square))
      .map((m) => m.slice(2, 4));
    expect(drill.reachable.sort()).toEqual([...new Set(fromPiece)].sort());
    expect(drill.reachable.length).toBeGreaterThanOrEqual(3);
    expect(['knight', 'bishop', 'rook', 'queen']).toContain(drill.role);
  });
});

describe('win the hanging piece', () => {
  it.each(SEEDS)('seed %i: exactly one black piece can be won, and every answer wins it', (seed) => {
    const p = hangingPosition(seeded(seed));
    const pos = fromFen(p.fen);
    expect(pos.turn).toBe('white');
    expect(pos.isCheck()).toBe(false);
    const wins = winningCaptures(pos);
    expect(new Set(wins.map((w) => w.name))).toEqual(new Set([p.target]));
    expect(p.answers.sort()).toEqual(wins.map((w) => w.uci).sort());
  });
});

describe('spot the loose pieces', () => {
  it.each(SEEDS)('seed %i: the loose pieces listed are exactly the undefended pieces of both sides', (seed) => {
    const p = loosePosition(seeded(seed));
    const pos = fromFen(p.fen);
    const expected = [...loosePieces(pos, 'white'), ...loosePieces(pos, 'black')].map((l) => l.name).sort();
    expect(p.loose.sort()).toEqual(expected);
    expect(p.loose.length).toBeGreaterThanOrEqual(1);
  });
});

describe('a start for the basic mates', () => {
  it.each(SEEDS)('seed %i: a legal king-and-queen start, White to move, with the game still on', (seed) => {
    const pos = fromFen(mateStart(seeded(seed), 'KQvK'));
    expect(materialSignature(pos)).toEqual({ signature: 'KQvK', strong: 'white' });
    expect(pos.turn).toBe('white');
    expect(pos.isEnd()).toBe(false);
    expect(kingMoves(pos, 'black')).toBeGreaterThan(0);
  });

  it.each(SEEDS)('seed %i: a legal king-and-rook start', (seed) => {
    const pos = fromFen(mateStart(seeded(seed), 'KRvK'));
    expect(materialSignature(pos)?.signature).toBe('KRvK');
    expect(pos.isEnd()).toBe(false);
  });
});
