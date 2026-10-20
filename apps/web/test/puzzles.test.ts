import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { begin, move, THEMES, type Puzzle } from '../src/lib/puzzles';
import manifest from '../src/data/puzzles/manifest.json';

// A Lichess mate in one: Black's queen takes on h2, mate, once White's knight has taken on e6.
const mate: Puzzle = {
  id: '000rZ',
  fen: '2kr1b1r/p1p2pp1/2pqb3/7p/3N2n1/2NPB3/PPP2PPP/R2Q1RK1 w - - 2 13',
  moves: ['d4e6', 'd6h2'],
  rating: 662,
  themes: ['mate', 'mateIn1'],
};

describe('a puzzle', () => {
  it("starts after the opponent's move, with the learner to play the other side", () => {
    const state = begin(mate);
    expect(state.lastMove).toBe('d4e6');
    expect(state.side).toBe('black');
    expect(state.fen.split(' ')[1]).toBe('b');
  });

  it('is solved by the move the puzzle gives', () => {
    expect(move(begin(mate), 'd6h2').result).toBe('solved');
  });

  it('turns down any other move, and leaves the position as it was', () => {
    const state = begin(mate);
    const after = move(state, 'd6d1');
    expect(after.result).toBe('wrong');
    expect(after.state.fen).toBe(state.fen);
  });

  it('accepts a different move that also mates on the last move, as Lichess does', () => {
    // Black's king is boxed in by its own pawns; either white rook mates on the back rank.
    const two: Puzzle = {
      id: 'x',
      fen: '6k1/R4ppp/1p6/8/8/8/5PPP/3R2K1 b - - 0 1',
      moves: ['b6b5', 'd1d8'],
      rating: 600,
      themes: ['mateIn1'],
    };
    expect(move(begin(two), 'a7a8').result).toBe('solved');
  });

  it("plays the opponent's reply after a right move in a longer puzzle", () => {
    // Doubled rooks against one defender: Re8+ Rxe8 Rxe8 mate.
    const longer: Puzzle = {
      id: 'y',
      fen: '3r2k1/5ppp/p7/8/8/8/4RPPP/4R1K1 b - - 0 1',
      moves: ['a6a5', 'e2e8', 'd8e8', 'e1e8'],
      rating: 900,
      themes: ['backRankMate'],
    };
    const after = move(begin(longer), 'e2e8');
    expect(after.result).toBe('right');
    expect(after.state.lastMove).toBe('d8e8');
    expect(move(after.state, 'e1e8').result).toBe('solved');
  });
});

describe('the puzzles shipped with the site', () => {
  it('cover every theme the drill offers, at every level, with puzzles to spare', () => {
    for (const theme of THEMES)
      for (const band of theme.bands) {
        const chunk = manifest.chunks.find((c) => c.theme === theme.id && c.min === band.min);
        expect(chunk?.count, `${theme.id} ${band.min}`).toBeGreaterThanOrEqual(40);
      }
  });

  it('credit their source and licence', () => {
    expect(manifest.licence).toBe('CC0');
    expect(manifest.source).toMatch(/Lichess/);
  });
});

describe('the puzzle pages', () => {
  const dist = (file: string) => readFileSync(new URL(`../dist/${file}`, import.meta.url), 'utf8');

  it('have a page of their own, explaining each theme and crediting the source', () => {
    const page = dist('chess/puzzles/index.html');
    for (const theme of THEMES) expect(page, theme.id).toContain(`href="/reference/${theme.entry}/"`);
    expect(page).toMatch(/Lichess puzzle database/);
  });

  it('are offered from the drills page and from each reference entry on a theme, before the puzzles on Lichess', () => {
    expect(dist('chess/drills/index.html')).toContain('href="/chess/puzzles/"');
    for (const [slug, theme] of [
      ['fork', 'fork'],
      ['pin', 'pin'],
      ['back-rank-mate', 'backRankMate'],
    ]) {
      const html = dist(`reference/chess/${slug}/index.html`);
      const here = html.indexOf(`href="/chess/puzzles/?theme=${theme}"`);
      expect(here, slug).toBeGreaterThan(0);
      expect(here, slug).toBeLessThan(html.indexOf('https://lichess.org/training/'));
    }
  });
});
