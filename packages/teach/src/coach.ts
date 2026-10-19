import type { Chess } from 'chessops/chess';
import { kingMoves, materialSignature } from './endgame';
import { losses } from './captures';
import { opposite, play, VALUE } from './position';

/**
 * Coach nudges: short rules of thumb fired by what a move did, at most one
 * per move, most serious first. Sources: supporting research on Heisman's
 * blunder check (H03, "is this move safe?") and the basic mates (M03).
 */
export interface Nudge {
  id: 'hanging' | 'stalemate' | 'stalemate-risk';
  text: string;
}

export function nudgeAfter(pos: Chess, uci: string): Nudge | undefined {
  const after = play(pos, uci);
  if (after.isCheckmate()) return undefined;
  const mover = pos.turn;
  const them = opposite(mover);

  if (after.isStalemate()) {
    return {
      id: 'stalemate',
      text: 'Stalemate: their king has no legal move but is not in check, so it is a draw. Always leave the king a square until you can mate.',
    };
  }

  // The opponent's winning replies, legal ones only.
  const [worst] = losses(after);
  if (worst) {
    const how = worst.loss >= VALUE[worst.role] ? 'can be taken for free' : 'can be won';
    return {
      id: 'hanging',
      text: `Your ${worst.role} on ${worst.name} ${how}. Before every move, ask: is this move safe?`,
    };
  }

  if (materialSignature(after)?.strong === mover && !after.isCheck() && kingMoves(after, them) === 1) {
    return {
      id: 'stalemate-risk',
      text: 'Their king has one square left. Make sure your next move leaves it a square or gives mate.',
    };
  }
  return undefined;
}
