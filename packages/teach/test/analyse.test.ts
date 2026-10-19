import { INITIAL_FEN } from 'chessops/fen';
import { describe, expect, it } from 'vitest';
import { analyseGame } from '../src/analyse';
import { fromFen, legalMoves, play } from '../src/position';

describe('analysing a whole game', () => {
  const scholar = ['e2e4', 'e7e5', 'f1c4', 'b8c6', 'd1h5', 'g8f6', 'h5f7'];

  it('reports each move in standard notation', () => {
    expect(analyseGame(INITIAL_FEN, scholar).map((p) => p.san)).toEqual([
      'e4',
      'e5',
      'Bc4',
      'Nc6',
      'Qh5',
      'Nf6',
      'Qxf7#',
    ]);
  });

  it('flags the move that allowed mate, and the mate', () => {
    const report = analyseGame(INITIAL_FEN, scholar);
    expect(report[5]).toMatchObject({ color: 'black', safe: false, allowsMate: 'h5f7' });
    expect(report[6]).toMatchObject({ color: 'white', mate: true });
  });

  it('is fast enough to run over a long game in the background', () => {
    // A 120-ply game of pseudo-random legal moves, the same every run.
    let seed = 7;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    let p = fromFen(INITIAL_FEN);
    const moves: string[] = [];
    while (moves.length < 120 && !p.isEnd()) {
      const options = legalMoves(p);
      const uci = options[Math.floor(random() * options.length)]!;
      moves.push(uci);
      p = play(p, uci);
    }
    const start = performance.now();
    expect(analyseGame(INITIAL_FEN, moves)).toHaveLength(moves.length);
    expect(performance.now() - start).toBeLessThan(1500);
  });
});
