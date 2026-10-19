import type { Chess } from 'chessops/chess';
import { mateInOne } from './forcing';
import { losses as lossesFor } from './captures';
import type { Hanging } from './hanging';
import { capturedValue, legal, play } from './position';

export interface Safety {
  safe: boolean;
  /** Material won by the move minus the most the opponent can then win. */
  net: number;
  /** The mover's pieces the opponent can then win, worst first. */
  losses: Hanging[];
  /** A mate the opponent then has, if any. */
  allowsMate: string | undefined;
}

/**
 * "Is this move safe?" (Heisman): after it, can the opponent win material or
 * mate at once? A quick count with exchange evaluation, not a search.
 */
export function moveSafety(pos: Chess, uci: string): Safety {
  const move = legal(pos, uci);
  if (!move) throw new Error(`${uci} is not a legal move here`);
  const gained = capturedValue(pos, move);
  const after = play(pos, uci);
  if (after.isCheckmate()) return { safe: true, net: Infinity, losses: [], allowsMate: undefined };
  // The opponent's winning replies: only legal ones, so a check limits them.
  const losses = lossesFor(after);
  const net = gained - (losses[0]?.loss ?? 0);
  const allowsMate = mateInOne(after);
  return { safe: net >= 0 && !allowsMate, net, losses, allowsMate };
}
