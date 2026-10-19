import type { Chess } from 'chessops/chess';
import type { Color, Role, Square } from 'chessops/types';
import type { SquareSet } from 'chessops/squareSet';
import { name, VALUE } from './position';

export interface Attacker {
  square: Square;
  name: string;
  role: Role;
}

/**
 * Pieces of `color` attacking `square` directly, cheapest first. Pieces hidden
 * behind another on the same line (x-rays) are not included; pass `occupied`
 * with pieces removed to reveal them.
 */
export function attackers(
  pos: Chess,
  square: Square,
  color: Color,
  occupied: SquareSet = pos.board.occupied,
): Attacker[] {
  return [...pos.kingAttackers(square, color, occupied).intersect(occupied)]
    .map((s) => ({ square: s, name: name(s), role: pos.board.get(s)!.role }))
    .sort((a, b) => VALUE[a.role] - VALUE[b.role]);
}

/** The pieces defending the piece on `square`: its own side's attackers of that square. */
export function defenders(pos: Chess, square: Square): Attacker[] {
  const piece = pos.board.get(square);
  return piece ? attackers(pos, square, piece.color) : [];
}
