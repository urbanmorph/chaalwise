import { RANKS, rankName, rankOf, rankPlural, rankValue, suitOf, type Card } from './cards';

/** Hand categories from weakest to strongest. */
export const CATEGORIES = [
  'high-card',
  'pair',
  'two-pair',
  'three-of-a-kind',
  'straight',
  'flush',
  'full-house',
  'four-of-a-kind',
  'straight-flush',
] as const;
export type Category = (typeof CATEGORIES)[number];

export interface HandValue {
  category: Category;
  /** Higher wins; equal scores tie and split the pot. */
  score: number;
  /** The five cards used, the cards that matter first. */
  best: Card[];
  /** Plain English, e.g. "a pair of kings", "a full house, queens full of fours". */
  name: string;
}

const rankAt = (value: number) => RANKS[value - 2]!;
const plural = (value: number) => rankPlural(rankAt(value));
const single = (value: number) => rankName(rankAt(value));

/** A straight's top card from five distinct values, high first, or 0. The wheel A-2-3-4-5 is five high. */
function straightTop(values: number[]): number {
  if (new Set(values).size !== 5) return 0;
  if (values[0]! - values[4]! === 4) return values[0]!;
  return values.join() === '14,5,4,3,2' ? 5 : 0;
}

function describe(category: Category, ranks: number[]): string {
  const [a = 0, b = 0] = ranks;
  switch (category) {
    case 'high-card':
      return `${single(a)} high`;
    case 'pair':
      return `a pair of ${plural(a)}`;
    case 'two-pair':
      return `two pair, ${plural(a)} and ${plural(b)}`;
    case 'three-of-a-kind':
      return `three of a kind, ${plural(a)}`;
    case 'straight':
      return `a straight, ${single(a)} high`;
    case 'flush':
      return `a flush, ${single(a)} high`;
    case 'full-house':
      return `a full house, ${plural(a)} full of ${plural(b)}`;
    case 'four-of-a-kind':
      return `four of a kind, ${plural(a)}`;
    case 'straight-flush':
      return a === 14 ? 'a royal flush' : `a straight flush, ${single(a)} high`;
  }
}

/** The value of exactly five cards. */
function evaluateFive(cards: Card[]): HandValue {
  // Cards in the order that matters: bigger groups first, then higher ranks.
  const count = (card: Card) => cards.filter((other) => rankOf(other) === rankOf(card)).length;
  const sorted = [...cards].sort((x, y) => count(y) - count(x) || rankValue(rankOf(y)) - rankValue(rankOf(x)));
  const values = sorted.map((card) => rankValue(rankOf(card)));
  const counts = sorted.map(count);
  const flush = cards.every((card) => suitOf(card) === suitOf(cards[0]!));
  const top = straightTop(values);

  let category: Category;
  let ranks = [...new Set(values)];
  let best = sorted;
  if (top) {
    category = flush ? 'straight-flush' : 'straight';
    ranks = [top];
    if (top === 5) best = [...sorted.slice(1), sorted[0]!]; // the wheel: ace goes last
  } else if (counts[0] === 4) category = 'four-of-a-kind';
  else if (counts[0] === 3 && counts[3] === 2) category = 'full-house';
  else if (flush) category = 'flush';
  else if (counts[0] === 3) category = 'three-of-a-kind';
  else if (counts[0] === 2 && counts[2] === 2) category = 'two-pair';
  else if (counts[0] === 2) category = 'pair';
  else category = 'high-card';

  const score = [0, 1, 2, 3, 4].reduce((sum, i) => sum * 15 + (ranks[i] ?? 0), CATEGORIES.indexOf(category));
  return { category, score, best, name: describe(category, ranks) };
}

/** Every way to choose k of the items. */
function choose<T>(items: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (items.length < k) return [];
  const [first, ...rest] = items as [T, ...T[]];
  return [...choose(rest, k - 1).map((combo) => [first, ...combo]), ...choose(rest, k)];
}

/** The best five-card hand from 5 to 7 cards. */
export function evaluate(cards: Card[]): HandValue {
  if (cards.length < 5 || cards.length > 7) throw new Error(`evaluate needs 5 to 7 cards, got ${cards.length}`);
  return choose(cards, 5)
    .map(evaluateFive)
    .reduce((best, hand) => (hand.score > best.score ? hand : best));
}

/** Positive if a wins, negative if b wins, zero for a tie. */
export const compare = (a: HandValue, b: HandValue): number => a.score - b.score;
