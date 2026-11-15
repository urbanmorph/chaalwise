import { readFileSync } from 'node:fs';
import { fromFen, play, VALUE } from '@chaalwise/teach/position';
import { rookAttacks } from 'chessops/attacks';
import type { Chess } from 'chessops/chess';
import { parseSquare, squareRank } from 'chessops/util';
import { describe, expect, it } from 'vitest';
import { toFen } from '../src/lib/chess';
import { PLANNED } from '../src/lib/planned-skills';
import { corpus } from './content';
import { board, lesson, material } from './strategy-boards';

/**
 * Four strategy lessons on setting up a decision: is it worth finding out (value of information), how long does
 * this deserve (time to decide), what else could this buy (opportunity cost) and would you choose it today (status
 * quo bias). These tests check what their boards claim, with chessops. The pawn ending was also checked against the
 * Lichess tablebase (tablebase.lichess.ovh, 15 Nov 2026):
 *
 * - 6n1/1PK5/8/8/8/8/6k1/8 w: b8=Q wins, and so does every king move; only promoting to less than a queen draws.
 * - 1Q4n1/2K5/8/8/8/8/6k1/8 b (after b8=Q): all 11 Black replies lose.
 */
const question = (id: string) => {
  const q = corpus.get(id) as { position: string; arrows?: string[]; options: string[]; answer: number } | undefined;
  if (!q) throw new Error(`no question ${id}`);
  return q;
};
/** How many legal moves the side to move has. */
const moveCount = (pos: Chess) => [...pos.allDests().values()].reduce((n, tos) => n + tos.size(), 0);

const LESSONS = {
  'is-it-worth-finding-out': { skill: 'calculate', sources: /Howard.*1966/ },
  'how-long-does-this-deserve': { skill: 'composure', sources: /Duke.*How to decide.*2020/i },
  'what-else-could-this-buy': { skill: 'value', sources: /Buchanan.*Frederick.*2009/ },
  'would-you-choose-it-today': { skill: 'plan-long', sources: /Samuelson.*Zeckhauser.*1988/ },
} as const;

describe('four lessons on setting up a decision', () => {
  it.each(Object.entries(LESSONS))('%s trains its track, cites its research and is in the curriculum', (id, want) => {
    const data = lesson(id);
    expect(data.skills).toEqual([want.skill]);
    expect((data.sources ?? []).map((s) => s.title).join(' | ')).toMatch(want.sources);
    expect(data.steps.length).toBeGreaterThanOrEqual(4);
    expect(data.steps.length).toBeLessThanOrEqual(8);
    expect(PLANNED).toContainEqual({ title: data.title, skill: want.skill, stage: data.stage });
    const life = [...corpus.keys()].filter((q) => q.startsWith(`life/${id}/`));
    expect(life.length, id).toBeGreaterThanOrEqual(3);
  });
});

describe('is it worth finding out: the pawn that queens whatever Black does', () => {
  const { fen, arrows } = board('is-it-worth-finding-out', 'on-the-board');
  const ask = question('chess/is-it-worth-finding-out/worth-a-look');

  it('asks about the position its reading shows, and draws the pawn move', () => {
    expect(toFen(ask.position)).toBe(fen);
    expect(arrows).toEqual(['b7b8']);
    expect(ask.arrows).toEqual(['b7b8']);
  });

  it('no Black piece can take a queen on b8, so that question had an answer that could have changed the move', () => {
    const pos = fromFen(fen);
    expect(pos.kingAttackers(parseSquare('b8')!, 'black', pos.board.occupied).isEmpty()).toBe(true);
    expect(ask.options[ask.answer]).toMatch(/take a new queen on b8/);
  });

  it('after b8=Q Black has 11 replies, none of them a capture, and White is a queen against a knight', () => {
    const after = play(fromFen(fen), 'b7b8q');
    expect(moveCount(after)).toBe(11);
    for (const [, tos] of after.allDests()) for (const to of tos) expect(after.board.get(to)).toBeUndefined();
    expect(material(after, 'white') - material(after, 'black')).toBe(VALUE.queen - VALUE.knight);
  });
});

describe('how long does this deserve: the recapture that is the only legal move', () => {
  const { fen, arrows } = board('how-long-does-this-deserve', 'on-the-board');

  it('has White in check from the queen on d1, with Kxd1 the only legal move', () => {
    const pos = fromFen(fen);
    expect(pos.isCheck()).toBe(true);
    expect(moveCount(pos)).toBe(1);
    expect(play(pos, 'e1d1').board.pieces('black', 'queen').isEmpty()).toBe(true);
    expect(arrows).toEqual(['e1d1']);
    expect(toFen(question('chess/how-long-does-this-deserve/clock-time').position)).toBe(fen);
  });
});

describe('what else could this buy: a pawn with check, or mate', () => {
  const { fen, arrows } = board('what-else-could-this-buy', 'on-the-board');

  it('Qxe5+ wins a pawn with check, but Black can answer it; Qxf7 is checkmate', () => {
    const pawn = play(fromFen(fen), 'h5e5');
    expect(pawn.isCheck()).toBe(true);
    expect(pawn.isCheckmate()).toBe(false);
    expect(material(pawn, 'white') - material(pawn, 'black')).toBe(1);
    // Nothing Black has can take the queen on e5; on f7 the bishop on c4 guards it.
    expect(pawn.kingAttackers(parseSquare('e5')!, 'black', pawn.board.occupied).isEmpty()).toBe(true);
    const mate = play(fromFen(fen), 'h5f7');
    expect(mate.isCheckmate()).toBe(true);
    expect([...mate.kingAttackers(parseSquare('f7')!, 'white', mate.board.occupied)]).toContain(parseSquare('c4')!);
    expect(arrows).toEqual(expect.arrayContaining(['h5e5', 'h5f7']));
    const ask = question('chess/what-else-could-this-buy/the-real-cost');
    expect(toFen(ask.position)).toBe(fen);
    expect(ask.arrows).toEqual(expect.arrayContaining(['h5e5', 'h5f7']));
  });
});

describe('would you choose it today: the rook still on a1', () => {
  const { fen, arrows } = board('would-you-choose-it-today', 'on-the-board');

  it('reaches nothing beyond the first rank from a1, and the whole open d-file from d1', () => {
    const pos = fromFen(fen);
    const reach = (square: string, p: Chess) => [...rookAttacks(parseSquare(square)!, p.board.occupied)];
    expect(reach('a1', pos).filter((sq) => squareRank(sq) > 1)).toEqual([]);
    for (const sq of ['d2', 'd3', 'd4', 'd5', 'd6', 'd7']) expect(pos.board.get(parseSquare(sq)!)).toBeUndefined();
    const moved = play(pos, 'a1d1');
    expect(reach('d1', moved)).toContain(parseSquare('d8')!);
    expect(arrows).toEqual(['a1d1']);
    expect(toFen(question('chess/would-you-choose-it-today/fresh-look').position)).toBe(fen);
  });
});

describe('the reference points to these lessons', () => {
  const body = (path: string) => readFileSync(new URL(`../src/content/reference/${path}`, import.meta.url), 'utf8');

  it('trade-offs links opportunity cost, and sunk cost tells it apart from staying put by default', () => {
    expect(body('strategy/trade-offs.md')).toContain('(/skills/what-else-could-this-buy/)');
    expect(body('strategy/sunk-cost.md')).toContain('(/skills/would-you-choose-it-today/)');
  });
});
