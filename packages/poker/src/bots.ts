import { rankOf, rankValue, suitOf, type Card } from './cards';
import { CATEGORIES, evaluate, type Category } from './evaluate';
import { outs } from './odds';
import type { Random } from './random';
import { act, legalMoves, toCall, type Move, type Table } from './table';

/**
 * Computer opponents. Cautious plays strong hands and rarely raises; steady raises
 * strong hands and folds weak ones to a bet; bold plays many hands, bets often
 * and sometimes bluffs.
 */
export type Style = 'cautious' | 'steady' | 'bold';
export const STYLES: readonly Style[] = ['cautious', 'steady', 'bold'];

const HIGH_POINTS: Record<number, number> = { 14: 10, 13: 8, 12: 7, 11: 6 };
const GAP_PENALTY = [0, 1, 2, 4];

/**
 * A simple starting-hand score after Bill Chen's formula: points for the high card,
 * doubled for a pair, plus 2 for suited, less for a gap, plus 1 for small connectors.
 * Aces 20, ace-king suited 12, seven-two offsuit below zero.
 */
export function startingScore(hole: Card[]): number {
  const [high, low] = hole.map((card) => rankValue(rankOf(card))).sort((a, b) => b - a) as [number, number];
  const points = HIGH_POINTS[high] ?? high / 2;
  if (high === low) return Math.max(points * 2, 5);
  const gap = high - low - 1;
  const suited = suitOf(hole[0]!) === suitOf(hole[1]!) ? 2 : 0;
  const connected = gap <= 1 && high < 12 ? 1 : 0;
  return points + suited - (GAP_PENALTY[gap] ?? 5) + connected;
}

const level = (category: Category) => CATEGORIES.indexOf(category);

/** The category the board makes on its own; with fewer than five cards, only its pairs and sets count. */
function boardLevel(board: Card[]): number {
  if (board.length >= 5) return level(evaluate(board).category);
  const counts = board.map((card) => board.filter((other) => rankOf(other) === rankOf(card)).length);
  const pairs = counts.filter((n) => n === 2).length / 2;
  if (counts.includes(4)) return level('four-of-a-kind');
  if (counts.includes(3)) return level('three-of-a-kind');
  return pairs === 2 ? level('two-pair') : pairs;
}

/**
 * How good a hand is after the flop, 0 to 4: 4 a straight or better, 3 two pair or a
 * set, 2 top pair or an overpair, 1 a lesser pair or a flush or open-ended straight
 * draw, 0 nothing. Only what the hole cards add to the board counts.
 */
export function postflopStrength(hole: Card[], board: Card[]): number {
  const all = [...hole, ...board];
  const made = level(evaluate(all).category);
  const onBoard = boardLevel(board);
  let strength = 0;
  if (made > onBoard) {
    if (made >= level('straight')) strength = 4;
    else if (made >= level('three-of-a-kind') || (made === level('two-pair') && onBoard === 0)) strength = 3;
    else {
      const paired = hole
        .map((card) => rankValue(rankOf(card)))
        .filter((value) => all.filter((card) => rankValue(rankOf(card)) === value).length >= 2);
      const topBoard = Math.max(...board.map((card) => rankValue(rankOf(card))));
      strength = Math.max(...paired) >= topBoard ? 2 : 1;
    }
  }
  if (strength < 1 && board.length < 5) {
    const draw = outs(hole, board);
    if (draw.drawing !== 'pair or better' && draw.count >= 8) strength = 1;
  }
  return strength;
}

const aggressive = (legal: Move[]): Move =>
  legal.includes('raise') ? 'raise' : legal.includes('bet') ? 'bet' : legal.includes('call') ? 'call' : 'check';
const passive = (legal: Move[]): Move => (legal.includes('check') ? 'check' : 'call');
const giveUp = (legal: Move[]): Move => (legal.includes('check') ? 'check' : 'fold');

function preflop(score: number, style: Style, legal: Move[], r: number): Move {
  switch (style) {
    case 'cautious':
      if (score >= 14) return r < 0.4 ? aggressive(legal) : passive(legal);
      return score >= 9 ? passive(legal) : giveUp(legal);
    case 'steady':
      if (score >= 10) return aggressive(legal);
      return score >= 7 ? passive(legal) : giveUp(legal);
    case 'bold':
      if (score >= 8 || r < 0.15) return aggressive(legal);
      if (score >= 4) return r < 0.4 ? aggressive(legal) : passive(legal);
      return r < 0.45 ? passive(legal) : giveUp(legal);
  }
}

function postflop(strength: number, style: Style, legal: Move[], facing: boolean, r: number): Move {
  if (strength === 4) return aggressive(legal);
  switch (style) {
    case 'cautious':
      if (strength === 3) return r < 0.5 ? aggressive(legal) : passive(legal);
      if (strength === 2) return passive(legal);
      return strength === 1 && facing && r < 0.3 ? 'call' : giveUp(legal);
    case 'steady':
      if (strength === 3) return aggressive(legal);
      if (strength === 2) return facing ? 'call' : r < 0.7 ? aggressive(legal) : 'check';
      return strength === 1 && facing ? 'call' : giveUp(legal);
    case 'bold':
      if (strength >= 2) return aggressive(legal);
      if (strength === 1) return r < 0.5 ? aggressive(legal) : passive(legal);
      if (facing) return r < 0.35 ? 'call' : 'fold';
      return r < 0.4 ? aggressive(legal) : 'check';
  }
}

/** The move a computer seat makes; always one of the legal moves. The seat must be the one to act. */
export function botMove(table: Table, seat: number, style: Style, random: Random): Move {
  if (seat !== table.toAct) throw new Error(`Seat ${seat} is not the one to act`);
  const legal = legalMoves(table);
  const hole = table.seats[seat]!.cards;
  const r = random();
  if (table.street === 'preflop') return preflop(startingScore(hole), style, legal, r);
  return postflop(postflopStrength(hole, table.board), style, legal, toCall(table) > 0, r);
}

/**
 * Plays the computer seats until a person is to act or the hand is over. Styles are
 * indexed by seat; a person's entry is ignored.
 */
export function playBots(table: Table, styles: readonly Style[], random: Random): Table {
  let t = table;
  while (!t.result && t.seats[t.toAct]!.isBot) t = act(t, botMove(t, t.toAct, styles[t.toAct] ?? 'steady', random));
  return t;
}
