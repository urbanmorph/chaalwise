import type { Color } from 'chessops/types';
import { makeSan } from 'chessops/san';
import type { Hanging } from './hanging';
import { fromFen, legal, play } from './position';
import { moveSafety } from './safety';

export interface PlyReport {
  ply: number;
  uci: string;
  san: string;
  color: Color;
  safe: boolean;
  /** Material won by the move minus what the opponent can then win. */
  net: number;
  /** The mover's pieces left to be won. */
  losses: Hanging[];
  /** The opponent's mating reply the move allowed, if any. */
  allowsMate: string | undefined;
  mate: boolean;
}

/** The teaching helpers run over every move of a game, for review. Pure, so it can run in a worker. */
export function analyseGame(startFen: string, moves: string[]): PlyReport[] {
  let pos = fromFen(startFen);
  return moves.map((uci, ply) => {
    const safety = moveSafety(pos, uci);
    const san = makeSan(pos, legal(pos, uci)!);
    const color = pos.turn;
    pos = play(pos, uci);
    return {
      ply,
      uci,
      san,
      color,
      safe: safety.safe,
      net: safety.net,
      losses: safety.losses,
      allowsMate: safety.allowsMate,
      mate: pos.isCheckmate(),
    };
  });
}
