import { makeFen } from 'chessops/fen';
import { nudgeAfter, type Nudge } from './coach';
import { loneKingMove } from './defender';
import { fromFen, play } from './position';

export interface Turn {
  /** The position after the learner's move and the reply. */
  fen: string;
  reply: string | undefined;
  nudge: Nudge | undefined;
  status: 'playing' | 'won' | 'lost';
  reason: 'stalemate' | 'piece-lost' | 'out-of-moves' | undefined;
}

/**
 * One turn of a play-it-out step: the learner's move, then the lone king's reply.
 * Pure, so it can run in the background worker.
 */
export function playTurn(fen: string, uci: string, movesLeft: number): Turn {
  const before = fromFen(fen);
  const nudge = nudgeAfter(before, uci);
  let pos = play(before, uci);
  const done = (status: Turn['status'], reason: Turn['reason'], reply?: string): Turn => ({
    fen: makeFen(pos.toSetup()),
    reply,
    nudge,
    status,
    reason,
  });

  if (pos.isCheckmate()) return done('won', undefined);
  if (pos.isStalemate()) return done('lost', 'stalemate');
  const reply = loneKingMove(pos)!;
  pos = play(pos, reply);
  if (pos.isInsufficientMaterial()) return done('lost', 'piece-lost', reply);
  if (movesLeft <= 1) return done('lost', 'out-of-moves', reply);
  return done('playing', undefined, reply);
}
