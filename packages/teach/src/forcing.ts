import type { Chess } from 'chessops/chess';
import { winningCaptures } from './captures';
import { hangingPieces } from './hanging';
import { capturedValue, legal, legalMoves, opposite, play } from './position';

/** Moves for the side to move that give check. */
export const checks = (pos: Chess): string[] => legalMoves(pos).filter((uci) => play(pos, uci).isCheck());

/** Moves for the side to move that capture something. */
export const captures = (pos: Chess): string[] =>
  legalMoves(pos).filter((uci) => capturedValue(pos, legal(pos, uci)!) > 0);

/** Quiet moves (not checks or captures) after which something of the opponent's can be won. */
export function threats(pos: Chess): string[] {
  const them = opposite(pos.turn);
  const before = new Set(hangingPieces(pos, them).map((h) => h.name));
  return legalMoves(pos).filter((uci) => {
    if (capturedValue(pos, legal(pos, uci)!) > 0) return false;
    const after = play(pos, uci);
    if (after.isCheck()) return false;
    return hangingPieces(after, them).some((h) => !before.has(h.name));
  });
}

/** A move that mates at once, if there is one. */
export function mateInOne(pos: Chess): string | undefined {
  return legalMoves(pos).find((uci) => play(pos, uci).isCheckmate());
}

export interface Threat {
  uci: string;
  kind: 'capture' | 'mate';
  wins: number;
}

/**
 * What the opponent would do if it were their move now: captures that win
 * material, and mate in one. Empty when the side to move is in check, since
 * then the question is how to get out of check.
 */
export function opponentThreats(pos: Chess): Threat[] {
  if (pos.isCheck()) return [];
  const passed = pos.clone();
  passed.turn = opposite(pos.turn);
  passed.epSquare = undefined;
  const found: Threat[] = [];
  const mate = mateInOne(passed);
  if (mate) found.push({ uci: mate, kind: 'mate', wins: Infinity });
  for (const { uci, wins } of winningCaptures(passed)) {
    if (uci !== mate) found.push({ uci, kind: 'capture', wins });
  }
  return found.sort((a, b) => b.wins - a.wins);
}
