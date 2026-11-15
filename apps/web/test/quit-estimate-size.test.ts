import { existsSync, readFileSync } from 'node:fs';
import { checks } from '@chaalwise/teach/forcing';
import { fromFen, play, VALUE } from '@chaalwise/teach/position';
import type { Chess } from 'chessops/chess';
import type { Color } from 'chessops/types';
import { parseSquare, squareFile, squareRank } from 'chessops/util';
import { describe, expect, it } from 'vitest';
import { toFen } from '../src/lib/chess';
import { corpus, frontmatter, lessonsIn } from './content';

/**
 * Three strategy lessons: know when to stop (quitting rules), estimate it (Fermi
 * estimates and the outside view) and commit in stages (size the risk). These
 * tests check what their boards claim, with chessops. The endgame verdicts were
 * also checked against the Lichess tablebase (tablebase.lichess.ovh, 15 Nov 2026):
 *
 * - 8/1k6/8/P6p/2K5/8/8/8 w: Kd3, Kd4, Kd5 and a6+ draw; Kb3, Kb4, Kb5, Kc3 and Kc5 lose.
 * - 8/8/8/6k1/1P6/8/7K/8 w (Black's king on g5): b5 wins.
 * - 8/8/8/5k2/1P6/8/7K/8 w (Black's king on f5): b5 only draws.
 */
const strategy = new Map(lessonsIn('strategy').map(({ file, data }) => [file.replace('.md', ''), data]));
const lesson = (id: string) => {
  const data = strategy.get(id);
  if (!data) throw new Error(`no strategy lesson ${id}`);
  return data;
};
const board = (id: string, step: string) => {
  const s = lesson(id).steps.find((st) => 'id' in st && st.id === step);
  if (!s || !('position' in s) || !s.position) throw new Error(`${id} ${step}: no board`);
  return { fen: toFen(s.position), arrows: ('arrows' in s ? s.arrows : undefined) ?? [] };
};
const question = (id: string) => corpus.get(id) as { position: string; arrows?: string[]; measures: string };

/** Kings move one square in any direction, so their distance is the larger of the file and rank gaps. */
const distance = (a: string, b: string) => {
  const [x, y] = [parseSquare(a)!, parseSquare(b)!];
  return Math.max(Math.abs(squareFile(x) - squareFile(y)), Math.abs(squareRank(x) - squareRank(y)));
};
const playAll = (fen: string, line: string[]) => line.reduce((pos, uci) => play(pos, uci), fromFen(fen));
const material = (pos: Chess, color: Color) =>
  (['pawn', 'knight', 'bishop', 'rook', 'queen'] as const).reduce(
    (sum, role) => sum + pos.board.pieces(color, role).size() * VALUE[role],
    0,
  );

describe('know when to stop: the king lets the a-pawn go', () => {
  const { fen, arrows } = board('know-when-to-stop', 'on-the-board');

  it('asks about the position its reading shows, and draws both king moves', () => {
    expect(toFen(question('chess/know-when-to-stop/let-it-go').position)).toBe(fen);
    expect(question('chess/know-when-to-stop/let-it-go').arrows).toEqual(expect.arrayContaining(['c4b5', 'c4d4']));
    expect(arrows).toEqual(expect.arrayContaining(['c4b5']));
  });

  it('only a king move away from the a-pawn is in time for the h-pawn, which needs four moves to reach h1', () => {
    // After White's move Black is to move, so the king must already be within four moves of h1.
    const inTime = (uci: string) => distance(uci.slice(2), 'h1') <= 4;
    expect(['c4b5', 'c4b4'].map(inTime)).toEqual([false, false]);
    expect(['c4d4', 'c4d5', 'c4d3'].map(inTime)).toEqual([true, true, true]);
    // The king on d4 takes the h-pawn as it arrives, while Black's king takes the a-pawn.
    const pos = playAll(fen, ['c4d4', 'b7a6', 'd4e3', 'h5h4', 'e3f2', 'h4h3', 'f2g1', 'h3h2', 'g1h2']);
    expect(pos.board.pieces('black', 'pawn').size()).toBe(0);
  });
});

describe('estimate it: count the race in parts', () => {
  const read = board('estimate-it', 'on-the-board');
  const ask = question('chess/estimate-it/one-square-closer');

  it('counts four pawn moves, and the king one move short of c7, the square next to b8', () => {
    expect(distance('b4', 'b8')).toBe(4);
    expect(distance('g5', 'c7')).toBe(4);
    const queened = playAll(read.fen, ['b4b5', 'g5f6', 'b5b6', 'f6e7', 'b6b7', 'e7d7', 'b7b8q']);
    expect(queened.board.get(parseSquare('b8')!)).toMatchObject({ color: 'white', role: 'queen' });
    expect(distance('d7', 'b8')).toBe(2);
    expect(read.arrows).toEqual(expect.arrayContaining(['b4b8', 'g5c7']));
  });

  it('one square closer, the king reaches c7 in three moves and takes the new queen', () => {
    expect(toFen(ask.position)).toBe(read.fen.replace('6k1', '5k2'));
    expect(distance('f5', 'c7')).toBe(3);
    const taken = playAll(toFen(ask.position), ['b4b5', 'f5e6', 'b5b6', 'e6d7', 'b6b7', 'd7c7', 'b7b8q', 'c7b8']);
    expect(taken.board.pieces('white', 'pawn').size() + taken.board.pieces('white', 'queen').size()).toBe(0);
  });
});

describe('commit in stages: the bishop given for one pawn', () => {
  const { fen, arrows } = board('commit-in-stages', 'on-the-board');

  it('Bxh7+ is check, and after Kxh7 White is two points down with no check to give', () => {
    expect(material(fromFen(fen), 'white')).toBe(material(fromFen(fen), 'black'));
    expect(play(fromFen(fen), 'd3h7').isCheck()).toBe(true);
    const after = playAll(fen, ['d3h7', 'g8h7']);
    expect(material(after, 'white') - material(after, 'black')).toBe(-2);
    expect(checks(after)).toEqual([]);
    expect(arrows).toEqual(['d3h7', 'g8h7']);
  });

  it('is taught in points and stages, never in betting words', () => {
    const ids = [...corpus.keys()].filter((id) => id.split('/')[1] === 'commit-in-stages');
    const text = JSON.stringify([lesson('commit-in-stages'), ...ids.map((id) => corpus.get(id))]);
    expect(ids.length).toBeGreaterThanOrEqual(5);
    expect(text).not.toMatch(/\b(kelly|bet|bets|betting|gambl\w*|wager\w*|stakes?|chips?|invest\w*|savings)\b/i);
  });
});

describe('the reference and the labs point to these lessons', () => {
  it('sunk cost names the quitting lesson, and base rates the estimate lesson', () => {
    expect(frontmatter('reference/strategy/sunk-cost.md').lesson).toBe('strategy/know-when-to-stop');
    expect(frontmatter('reference/strategy/base-rates.md').lesson).toBe('strategy/estimate-it');
  });

  it('cites the research each idea comes from', () => {
    const titles = (id: string) => (lesson(id).sources ?? []).map((s) => s.title).join(' | ');
    expect(titles('know-when-to-stop')).toMatch(/Arkes.*1985.*Staw.*1976.*Duke.*2022/);
    expect(titles('estimate-it')).toMatch(/Kahneman.*Tversky.*1979.*Lovallo.*Kahneman.*2003.*Tetlock.*Gardner.*2015/);
  });

  it('ends the estimate lesson with the Which bag? lab, on the built page', () => {
    const file = new URL('../dist/skills/estimate-it/index.html', import.meta.url);
    expect(existsSync(file), 'run `pnpm build` first').toBe(true);
    expect(readFileSync(file, 'utf8').match(/<p class="try-lab"[\s\S]*?<\/p>/)?.[0]).toContain(
      'href="/labs/which-bag/"',
    );
  });
});
