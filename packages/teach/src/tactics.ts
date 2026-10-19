import { attacks } from 'chessops/attacks';
import type { Chess } from 'chessops/chess';
import type { Color, Square } from 'chessops/types';
import { parseSquare } from 'chessops/util';
import { attackers } from './attacks';
import { exchange } from './exchange';
import { legalMoves, name, opposite, play, VALUE } from './position';

/** The first occupied square beyond `to`, continuing the line from `from` through `to`. */
function nextAlong(pos: Chess, from: Square, to: Square): Square | undefined {
  const df = Math.sign((to & 7) - (from & 7));
  const dr = Math.sign((to >> 3) - (from >> 3));
  for (let f = (to & 7) + df, r = (to >> 3) + dr; f >= 0 && f < 8 && r >= 0 && r < 8; f += df, r += dr) {
    if (pos.board.occupied.has(r * 8 + f)) return r * 8 + f;
  }
  return undefined;
}

/** For each line piece of `color`: enemy pieces it attacks with another enemy piece directly behind. */
function linedUp(pos: Chess, color: Color): { by: Square; front: Square; behind: Square }[] {
  const lines = pos.board[color].intersect(pos.board.bishop.union(pos.board.rook).union(pos.board.queen));
  const enemy = pos.board[opposite(color)];
  const found = [];
  for (const by of lines) {
    for (const front of attacks(pos.board.get(by)!, by, pos.board.occupied).intersect(enemy)) {
      const behind = nextAlong(pos, by, front);
      if (behind !== undefined && enemy.has(behind)) found.push({ by, front, behind });
    }
  }
  return found;
}

const roleAt = (pos: Chess, square: Square) => pos.board.get(square)!.role;

/** Pieces of `color` pinned by an enemy line piece to their king or to something worth more. */
export function pins(pos: Chess, color: Color): { pinned: string; by: string; to: string }[] {
  return linedUp(pos, opposite(color))
    .filter(
      ({ front, behind }) => roleAt(pos, front) !== 'king' && VALUE[roleAt(pos, behind)] > VALUE[roleAt(pos, front)],
    )
    .map(({ by, front, behind }) => ({ pinned: name(front), by: name(by), to: name(behind) }));
}

/** Line pieces of `color` attacking a valuable piece with a lesser one (not a pawn) behind it, won when the first moves. */
export function skewers(pos: Chess, color: Color): { by: string; front: string; behind: string }[] {
  return linedUp(pos, color)
    .filter(
      ({ front, behind }) => VALUE[roleAt(pos, front)] > VALUE[roleAt(pos, behind)] && roleAt(pos, behind) !== 'pawn',
    )
    .map(({ by, front, behind }) => ({ by: name(by), front: name(front), behind: name(behind) }));
}

/** Pieces of `color` attacking two or more enemy targets at once: the king, something worth more, or something won outright. */
export function forks(pos: Chess, color: Color): { by: string; targets: string[] }[] {
  const found = [];
  for (const by of pos.board[color]) {
    const value = VALUE[roleAt(pos, by)];
    const targets = [...pos.board[opposite(color)]].filter((t) => {
      if (!attackers(pos, t, color).some((a) => a.square === by)) return false;
      const target = roleAt(pos, t);
      return target === 'king' || VALUE[target] > value || exchange(pos, t, color) > 0;
    });
    if (targets.length >= 2) found.push({ by: name(by), targets: targets.map(name).sort() });
  }
  return found;
}

/** Moves for the side to move that fork with the moved piece, without simply losing it. */
export function forkingMoves(pos: Chess): string[] {
  const us = pos.turn;
  return legalMoves(pos).filter((uci) => {
    const after = play(pos, uci);
    const landed = uci.slice(2, 4);
    if (exchange(after, parseSquare(landed)!, opposite(us)) > 0) return false;
    return forks(after, us).some((f) => f.by === landed);
  });
}
