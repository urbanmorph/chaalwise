import type { Chess } from 'chessops/chess';
import type { Color, Square } from 'chessops/types';
import { attackers } from './attacks';
import { opposite, VALUE } from './position';

/**
 * Static exchange evaluation: the material `side` wins by starting a capture
 * sequence on `square`, if both sides keep capturing with their cheapest
 * piece only while it pays, and either may stop. Pieces lined up behind each
 * other join in turn (x-rays). A king captures only onto an undefended square.
 * Pins are ignored, as in most teaching tools: it is a quick count, not a search.
 */
export function exchange(pos: Chess, square: Square, side: Color): number {
  const target = pos.board.get(square);
  if (!target || target.color === side) return 0;

  let occupied = pos.board.occupied;
  let color = side;
  let onSquare = VALUE[target.role];
  const gains: number[] = [];

  for (;;) {
    const [first] = attackers(pos, square, color, occupied);
    if (!first) break;
    if (first.role === 'king' && attackers(pos, square, opposite(color), occupied.without(first.square)).length) break;
    gains.push(onSquare);
    if (onSquare === Infinity) break;
    onSquare = VALUE[first.role];
    occupied = occupied.without(first.square);
    color = opposite(color);
  }

  // Unwind: each side takes only if what follows still leaves it ahead.
  let result = 0;
  for (let i = gains.length - 1; i >= 0; i--) result = Math.max(0, gains[i]! - result);
  return result;
}
