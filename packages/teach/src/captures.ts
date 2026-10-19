import type { Chess } from 'chessops/chess';
import { exchange } from './exchange';
import type { Hanging } from './hanging';
import { capturedPiece, legal, legalMoves, name, opposite, play, VALUE } from './position';

export interface WinningCapture {
  uci: string;
  /** The captured piece's square (differs from the destination for en passant). */
  name: string;
  role: Hanging['role'];
  /** Material won once the exchange on that square plays out. */
  wins: number;
}

/**
 * The side to move's legal captures that win material, each scored on its own:
 * what it takes, minus what the opponent then wins back on that square. Only
 * legal moves count, so a check or a pin limits the choice, and en passant is included.
 */
export function winningCaptures(pos: Chess): WinningCapture[] {
  const found: WinningCapture[] = [];
  for (const uci of legalMoves(pos)) {
    const move = legal(pos, uci)!;
    const captured = capturedPiece(pos, move);
    if (!captured) continue;
    const after = play(pos, uci);
    const wins = VALUE[captured.role] - exchange(after, move.to, opposite(pos.turn));
    if (wins > 0) found.push({ uci, name: name(captured.square), role: captured.role, wins });
  }
  return found.sort((a, b) => b.wins - a.wins);
}

/** What the side to move can win, one entry per piece of the opponent's, best capture first. */
export function losses(pos: Chess): Hanging[] {
  const best = new Map<string, Hanging>();
  for (const c of winningCaptures(pos))
    if (!best.has(c.name)) best.set(c.name, { name: c.name, role: c.role, loss: c.wins });
  return [...best.values()];
}
