import type { Chess } from 'chessops/chess';
import type { Color, Square } from 'chessops/types';
import { kingAttacks } from 'chessops/attacks';
import { attackers } from './attacks';
import { opposite } from './position';

const LETTER = { queen: 'Q', rook: 'R', bishop: 'B', knight: 'N', pawn: 'P' } as const;

/** The basic mates: one side has only its king, the other a king and listed pieces (e.g. KQvK). */
export function materialSignature(pos: Chess): { signature: string; strong: Color } | undefined {
  for (const strong of ['white', 'black'] as const) {
    const weak = opposite(strong);
    if (pos.board[weak].size() !== 1) continue;
    const pieces = [...pos.board[strong].diff(pos.board.king)].map(
      (s) => LETTER[pos.board.get(s)!.role as keyof typeof LETTER],
    );
    const order = 'QRBNP';
    pieces.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    return { signature: `K${pieces.join('')}vK`, strong };
  }
  return undefined;
}

/** The squares the king of `color` could move to now (as if it were its turn). */
function kingSquares(pos: Chess, color: Color): Square[] {
  const king = pos.board.kingOf(color);
  if (king === undefined) return [];
  const occupied = pos.board.occupied.without(king);
  return [...kingAttacks(king).diff(pos.board[color])].filter(
    (s) => attackers(pos, s, opposite(color), occupied).length === 0,
  );
}

export const kingMoves = (pos: Chess, color: Color): number => kingSquares(pos, color).length;

/** Squares between `square` and the nearest edge of the board (0 on the edge, 3 in the centre). */
export const edgeDistance = (square: Square): number =>
  Math.min(square & 7, 7 - (square & 7), square >> 3, 7 - (square >> 3));

/**
 * A back-rank weakness: the king of `color` is on its first rank with no
 * square to step to off that rank (a check along the rank covers the rest),
 * and the opponent still has a rook or queen.
 */
export function backRankWeak(pos: Chess, color: Color): boolean {
  const king = pos.board.kingOf(color);
  if (king === undefined) return false;
  const firstRank = color === 'white' ? 0 : 7;
  const heavy = pos.board[opposite(color)].intersect(pos.board.rook.union(pos.board.queen));
  return king >> 3 === firstRank && !heavy.isEmpty() && kingSquares(pos, color).every((s) => s >> 3 === firstRank);
}
