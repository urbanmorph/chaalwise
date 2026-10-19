import type { Chess } from 'chessops/chess';
import type { Color, Role } from 'chessops/types';
import { defenders } from './attacks';
import { exchange } from './exchange';
import { name, opposite } from './position';

export interface Hanging {
  name: string;
  role: Role;
  /** Material the opponent wins by taking it. */
  loss: number;
}

/** Pieces of `color` the opponent can win material by taking: undefended, or attacked by something cheaper. */
export function hangingPieces(pos: Chess, color: Color): Hanging[] {
  const found: Hanging[] = [];
  for (const square of pos.board[color].diff(pos.board.king)) {
    const loss = exchange(pos, square, opposite(color));
    if (loss > 0) found.push({ name: name(square), role: pos.board.get(square)!.role, loss });
  }
  return found.sort((a, b) => b.loss - a.loss);
}

/** "Loose pieces drop off": pieces (not pawns or the king) of `color` that nothing defends. */
export function loosePieces(pos: Chess, color: Color): { name: string; role: Role }[] {
  const pieces = pos.board[color].diff(pos.board.king).diff(pos.board.pawn);
  return [...pieces]
    .filter((square) => defenders(pos, square).length === 0)
    .map((square) => ({ name: name(square), role: pos.board.get(square)!.role }));
}
