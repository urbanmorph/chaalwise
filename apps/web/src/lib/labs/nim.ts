import { between, type Random } from './seeded';

/**
 * Nim with one pile: each turn a player takes 1, 2 or 3 counters, and whoever
 * takes the last one wins. Worked backwards from the end, the player who
 * leaves a multiple of 4 can always win.
 */
export const TAKES = [1, 2, 3] as const;
export const GAMES = 5;
export const MIN_PILE = 10;
export const MAX_PILE = 21;

export type Player = 'you' | 'bot';
export type StartMode = Player | 'alternate';

/** The take that leaves a multiple of 4, or none when the pile already is one. */
export const winningMove = (pile: number): number | undefined => (pile % 4 === 0 ? undefined : pile % 4);

/** The bot plays perfectly when it can, and takes 1 when it cannot. */
export const botTake = (pile: number): number => winningMove(pile) ?? 1;

/** The pile sizes for the five games. */
export const drawPiles = (random: Random): number[] =>
  Array.from({ length: GAMES }, () => between(MIN_PILE, MAX_PILE, random));

/** Who moves first in a game, counted from 0. Taking turns starts with you. */
export const starter = (mode: StartMode, game: number): Player =>
  mode === 'alternate' ? (game % 2 ? 'bot' : 'you') : mode;

export interface Review {
  before: number;
  take: number;
  left: number;
  /** It left a multiple of 4: a losing position for the bot. */
  good: boolean;
  /** The take that would have left one, if there was any. */
  best: number | undefined;
}

/** Looks back at one of the learner's moves. */
export const review = (before: number, take: number): Review => ({
  before,
  take,
  left: before - take,
  good: (before - take) % 4 === 0,
  best: winningMove(before),
});
