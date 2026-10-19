import { Chess } from 'chessops/chess';
import { makeFen } from 'chessops/fen';
import { emptySetup } from 'chessops/setup';
import type { Color, Role, Square } from 'chessops/types';
import { winningCaptures } from './captures';
import { kingMoves } from './endgame';
import { loosePieces } from './hanging';
import { legalMoves, name } from './position';

/**
 * Fresh positions for practice, so a learner meets an idea in many positions,
 * not one. Every generator retries until the teaching helpers confirm the
 * position fits the idea, so the answer is always computed, never assumed.
 */

export type Random = () => number;

/** A small seeded random source (mulberry32), so tests and shared links can repeat a position. */
export function seeded(seed: number): Random {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T>(random: Random, items: readonly T[]): T => items[Math.floor(random() * items.length)]!;

type Placement = [Square, Role, Color][];

/** A legal position from a placement, White to move, or undefined. Pawns never stand on the first or last rank. */
function position(placement: Placement): Chess | undefined {
  const squares = new Set(placement.map(([s]) => s));
  if (squares.size !== placement.length) return undefined;
  if (placement.some(([s, role]) => role === 'pawn' && (s >> 3 === 0 || s >> 3 === 7))) return undefined;
  const setup = emptySetup();
  for (const [square, role, color] of placement) setup.board.set(square, { role, color });
  setup.turn = 'white';
  const pos = Chess.fromSetup(setup);
  return pos.isOk && !pos.value.isCheck() && !pos.value.isEnd() ? pos.value : undefined;
}

const fen = (pos: Chess) => makeFen(pos.toSetup());
const square = (random: Random) => Math.floor(random() * 64);

/** Try a generator until it gives a position; a safety limit keeps a bad generator from looping forever. */
function retry<T>(make: () => T | undefined): T {
  for (let i = 0; i < 10_000; i++) {
    const found = make();
    if (found) return found;
  }
  throw new Error('no position found');
}

/** Where can this piece go? A white piece on a random square, with every square it can legally reach. */
export function pieceSquares(random: Random): { fen: string; square: string; role: Role; reachable: string[] } {
  return retry(() => {
    const role = pick(random, ['knight', 'bishop', 'rook', 'queen'] as const);
    const from = square(random);
    const pos = position([
      [from, role, 'white'],
      [square(random), 'king', 'white'],
      [square(random), 'king', 'black'],
    ]);
    if (!pos) return undefined;
    const at = name(from);
    const reachable = [
      ...new Set(
        legalMoves(pos)
          .filter((m) => m.startsWith(at))
          .map((m) => m.slice(2, 4)),
      ),
    ];
    return reachable.length >= 3 ? { fen: fen(pos), square: at, role, reachable } : undefined;
  });
}

const PIECES = ['knight', 'bishop', 'rook', 'queen'] as const;
const MINOR_OR_ROOK = ['pawn', 'knight', 'bishop', 'rook'] as const;

/** A position where exactly one black piece can be won, with every winning capture of it. */
export function hangingPosition(random: Random): { fen: string; target: string; answers: string[] } {
  return retry(() => {
    const pos = position([
      [square(random), 'king', 'white'],
      [square(random), pick(random, PIECES), 'white'],
      [square(random), pick(random, PIECES), 'white'],
      [square(random), 'king', 'black'],
      [square(random), pick(random, MINOR_OR_ROOK), 'black'],
      [square(random), pick(random, MINOR_OR_ROOK), 'black'],
    ]);
    if (!pos) return undefined;
    const wins = winningCaptures(pos);
    const targets = new Set(wins.map((w) => w.name));
    if (targets.size !== 1) return undefined;
    return { fen: fen(pos), target: [...targets][0]!, answers: wins.map((w) => w.uci) };
  });
}

/** A position with some undefended pieces (not pawns or kings), on either side, listed. */
export function loosePosition(random: Random): { fen: string; loose: string[] } {
  return retry(() => {
    const pos = position([
      [square(random), 'king', 'white'],
      [square(random), pick(random, MINOR_OR_ROOK), 'white'],
      [square(random), pick(random, PIECES), 'white'],
      [square(random), pick(random, MINOR_OR_ROOK), 'white'],
      [square(random), 'king', 'black'],
      [square(random), pick(random, MINOR_OR_ROOK), 'black'],
      [square(random), pick(random, PIECES), 'black'],
      [square(random), pick(random, MINOR_OR_ROOK), 'black'],
    ]);
    if (!pos) return undefined;
    const loose = [...loosePieces(pos, 'white'), ...loosePieces(pos, 'black')].map((l) => l.name);
    return loose.length >= 1 && loose.length <= 4 ? { fen: fen(pos), loose } : undefined;
  });
}

/** A random legal start for a basic mate, White to move, with the lone king free to move. */
export function mateStart(random: Random, signature: 'KQvK' | 'KRvK'): string {
  return retry(() => {
    const pos = position([
      [square(random), 'king', 'white'],
      [square(random), signature === 'KQvK' ? 'queen' : 'rook', 'white'],
      [square(random), 'king', 'black'],
    ]);
    if (!pos || kingMoves(pos, 'black') === 0) return undefined;
    return fen(pos);
  });
}
