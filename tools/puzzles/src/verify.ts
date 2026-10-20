import { Chess } from 'chessops/chess';
import { parseFen } from 'chessops/fen';
import { parseUci } from 'chessops/util';
import type { Puzzle } from './csv.ts';

/**
 * Replays a Lichess puzzle with chessops: the FEN must be a legal position, and every move legal
 * in turn (the first is the opponent's move that sets the puzzle, the rest the solution, so the
 * count is even). A puzzle tagged `mate` must end in checkmate.
 */
export function verifyPuzzle(p: Puzzle): boolean {
  if (p.moves.length < 2 || p.moves.length % 2) return false;
  const setup = parseFen(p.fen);
  if (setup.isErr) return false;
  const pos = Chess.fromSetup(setup.value);
  if (pos.isErr) return false;
  const chess = pos.value;
  for (const uci of p.moves) {
    const move = parseUci(uci);
    if (!move || !chess.isLegal(move)) return false;
    chess.play(move);
  }
  return !p.themes.includes('mate') || chess.isCheckmate();
}
