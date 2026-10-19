import type { Chess } from 'chessops/chess';
import { parseSquare } from 'chessops/util';
import { edgeDistance, kingMoves } from './endgame';
import { legalMoves, opposite, play } from './position';

/**
 * The computer's lone king in the basic mates (phase 2; the full opponent is
 * Stockfish, phase 3). It takes anything it can, otherwise goes where it will
 * have the most room, preferring the centre, so the learner must box it in.
 */
export function loneKingMove(pos: Chess): string | undefined {
  const moves = legalMoves(pos);
  const capture = moves.find((uci) => pos.board.get(parseSquare(uci.slice(2, 4))!)?.color === opposite(pos.turn));
  if (capture) return capture;
  const score = (uci: string) => kingMoves(play(pos, uci), pos.turn) * 10 + edgeDistance(parseSquare(uci.slice(2, 4))!);
  return moves.reduce<string | undefined>(
    (best, uci) => (best === undefined || score(uci) > score(best) ? uci : best),
    undefined,
  );
}
