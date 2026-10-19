import { Chess, normalizeMove } from 'chessops/chess';
import { parseFen } from 'chessops/fen';
import type { Color, NormalMove, Role, Square } from 'chessops/types';
import { makeSquare, parseUci, roleToChar } from 'chessops/util';

/** Shared position helpers for the teaching helpers. Squares are chessops numbers (a1 = 0). */

/** Rough piece values in points. The king is beyond price, so it counts as infinite. */
export const VALUE: Record<Role, number> = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: Infinity };

export const opposite = (color: Color): Color => (color === 'white' ? 'black' : 'white');

export const name = makeSquare;

export function fromFen(fen: string): Chess {
  return Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
}

/** A standard UCI move (castling as e1g1) as a legal chessops move, or undefined. */
export function legal(pos: Chess, uci: string): NormalMove | undefined {
  const move = parseUci(uci);
  if (!move || !('from' in move)) return undefined;
  const normal = normalizeMove(pos, move) as NormalMove;
  return pos.isLegal(normal) ? normal : undefined;
}

/** The position after a legal move; throws on an illegal one. */
export function play(pos: Chess, uci: string): Chess {
  const move = legal(pos, uci);
  if (!move) throw new Error(`${uci} is not a legal move here`);
  const next = pos.clone();
  next.play(move);
  return next;
}

/** A move as lessons and the board write it: castling as the king's real destination (e1g1), not king-takes-rook. */
export function standardUci(pos: Chess, move: NormalMove): string {
  const piece = pos.board.get(move.from);
  const castles = piece?.role === 'king' && pos.board.get(move.to)?.color === piece.color;
  const to = castles ? move.from + ((move.to & 7) > (move.from & 7) ? 2 : -2) : move.to;
  return makeSquare(move.from) + makeSquare(to) + (move.promotion ? roleToChar(move.promotion) : '');
}

/** Every legal move in standard UCI (castling as e1g1, promotion to a queen only). */
export function legalMoves(pos: Chess): string[] {
  const moves = new Set<string>();
  for (const [from, tos] of pos.allDests()) {
    const piece = pos.board.get(from)!;
    for (const to of tos) {
      const promotes = piece.role === 'pawn' && (to >> 3 === 7 || to >> 3 === 0);
      moves.add(standardUci(pos, { from, to, promotion: promotes ? 'queen' : undefined }));
    }
  }
  return [...moves];
}

/** The piece a move captures and where it stood, en passant included. */
export function capturedPiece(pos: Chess, move: NormalMove): { square: Square; role: Role } | undefined {
  const target = pos.board.get(move.to);
  if (target && target.color !== pos.turn) return { square: move.to, role: target.role };
  const piece = pos.board.get(move.from);
  if (piece?.role === 'pawn' && move.to === pos.epSquare)
    return { square: move.to + (pos.turn === 'white' ? -8 : 8), role: 'pawn' };
  return undefined;
}

/** The value captured by a move, en passant included (castling captures nothing). */
export function capturedValue(pos: Chess, move: NormalMove): number {
  const captured = capturedPiece(pos, move);
  return captured ? VALUE[captured.role] : 0;
}
