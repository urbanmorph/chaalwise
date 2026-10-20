import { capturedPiece, fromFen, legal, legalMoves, play } from '@chaalwise/teach/position';

/**
 * The first five minutes of chess: a game against a gentle bot, with each rule
 * explained the moment it comes up rather than taught first. The learner plays
 * White.
 */

/** The bot's reply: any legal move, but no captures while a quiet move exists, so a first game is not a beating. */
export function gentleReply(fen: string, random: () => number): string | undefined {
  const pos = fromFen(fen);
  const moves = legalMoves(pos);
  const quiet = moves.filter((uci) => !capturedPiece(pos, legal(pos, uci)!));
  const pool = quiet.length ? quiet : moves;
  return pool[Math.floor(random() * pool.length)];
}

const CASTLING = new Set(['e1g1', 'e1c1', 'e8g8', 'e8c8']);

/** What the coach says about a move, if it shows a rule: a capture, check, castling, promotion or mate. */
export function coachNote(before: string, uci: string): string | undefined {
  const pos = fromFen(before);
  const move = legal(pos, uci);
  if (!move) return undefined;
  const you = pos.turn === 'white';
  const after = play(pos, uci);
  if (after.isCheckmate())
    return you
      ? 'Checkmate! The king is attacked and has no way out. That ends the game, and you have won it.'
      : 'Checkmate: your king is attacked and has no way out, so Black has won this one. Every player loses games like this at first.';
  if (move.promotion)
    return `Your pawn reached the far side and became a queen, the strongest piece.${after.isCheck() ? ' It gives check too.' : ''}`;
  if (after.isCheck())
    return you
      ? 'Check: you are attacking the king. Black must deal with it at once.'
      : 'You are in check: your king is attacked. You must get out of it now: move the king, block the line, or take the attacker.';
  if (CASTLING.has(uci) && pos.board.get(move.from)?.role === 'king')
    return you
      ? 'You castled: the king moved two squares and the rook jumped over it. It tucks the king away and brings the rook into play.'
      : 'Black castled: the king moved two squares and the rook jumped over it.';
  if (capturedPiece(pos, move))
    return you
      ? 'You took a piece: it leaves the board, and yours takes its square.'
      : 'Black took one of your pieces. Before each move, look at what the other side could take.';
  return undefined;
}
