import { deck, rankOf, shuffle, type Card } from './cards';
import { CATEGORIES, compare, evaluate, type Category } from './evaluate';
import type { Random } from './random';

/** What a hand is drawing to. */
export type Drawing = 'flush' | 'straight' | 'flush or straight' | 'pair or better';

export interface Outs {
  count: number;
  cards: Card[];
  drawing: Drawing;
}

const rank = (category: Category) => CATEGORIES.indexOf(category);

/**
 * The unseen cards that would improve the hand, for the coach, on the flop or turn.
 * A flush or straight draw counts only the cards that complete it, and only when
 * the made hand is not on the board alone. With no such draw, the outs are the
 * cards that pair a hole card and lift the hand a category (overcards, sets).
 */
export function outs(hole: Card[], board: Card[]): Outs {
  if (board.length !== 3 && board.length !== 4) throw new Error('Outs are counted on the flop or the turn');
  const known = [...hole, ...board];
  const now = rank(evaluate(known).category);
  const unseen = deck().filter((card) => !known.includes(card));

  const flush: Card[] = [];
  const straight: Card[] = [];
  const pair: Card[] = [];
  for (const card of unseen) {
    const after = evaluate([...known, card]);
    const level = rank(after.category);
    if (level <= now) continue;
    const boardAlone = board.length === 4 ? rank(evaluate([...board, card]).category) : -1;
    if (after.category === 'flush' || after.category === 'straight-flush') {
      if (boardAlone < level) flush.push(card);
    } else if (after.category === 'straight') {
      if (boardAlone < level) straight.push(card);
    } else if (hole.some((h) => rankOf(h) === rankOf(card))) pair.push(card);
  }

  if (flush.length && straight.length) {
    const cards = [...flush, ...straight];
    return { count: cards.length, cards, drawing: 'flush or straight' };
  }
  if (flush.length) return { count: flush.length, cards: flush, drawing: 'flush' };
  if (straight.length) return { count: straight.length, cards: straight, drawing: 'straight' };
  return { count: pair.length, cards: pair, drawing: 'pair or better' };
}

/** The rule of 2 and 4: a rough percentage chance to hit, 4 × outs with two cards to come, 2 × outs with one. */
export const ruleOf = (outs: number, cardsToCome: 1 | 2): number => outs * (cardsToCome === 2 ? 4 : 2);

/** The exact percentage chance that at least one of the outs comes among the next cards. */
export function exactChance(outs: number, unseen: number, cardsToCome: 1 | 2): number {
  let miss = 1;
  for (let i = 0; i < cardsToCome; i++) miss *= (unseen - outs - i) / (unseen - i);
  return (1 - miss) * 100;
}

export interface Equity {
  /** Percentage of the pot the hand wins on average: wins, plus half the ties. */
  share: number;
  /** Worked out over every case (true) or by sampling (false). */
  exact: boolean;
}

/** Above this many cases, equity is sampled instead of counted. */
const MOST_CASES = 60_000;

const pairs = (cards: Card[]): Card[][] => cards.flatMap((a, i) => cards.slice(i + 1).map((b) => [a, b]));
const combos = (cards: Card[], k: number): Card[][] =>
  k === 0 ? [[]] : cards.flatMap((card, i) => combos(cards.slice(i + 1), k - 1).map((rest) => [card, ...rest]));
const choose = (n: number, k: number): number => (k === 0 ? 1 : (n * choose(n - 1, k - 1)) / k);

/**
 * Equity: the share of the pot a hand wins on average against one other hand,
 * known or (by default) any two cards, over the shared cards still to come.
 * Counted exactly when the cases are few, as on the turn or river; sampled otherwise.
 */
export function equity(
  hole: Card[],
  board: Card[],
  { against, random = Math.random, samples = 3000 }: { against?: Card[]; random?: Random; samples?: number } = {},
): Equity {
  const unseen = deck().filter((card) => ![...hole, ...board, ...(against ?? [])].includes(card));
  const toCome = 5 - board.length;
  const others = against ? 1 : choose(unseen.length, 2);
  const cases = others * choose(unseen.length - (against ? 0 : 2), toCome);
  let won = 0;
  let total = 0;
  const play = (theirs: Card[], rest: Card[]) => {
    const full = [...board, ...rest];
    const result = compare(evaluate([...hole, ...full]), evaluate([...theirs, ...full]));
    won += result > 0 ? 1 : result === 0 ? 0.5 : 0;
    total += 1;
  };
  if (cases <= MOST_CASES) {
    for (const theirs of against ? [against] : pairs(unseen)) {
      const left = unseen.filter((card) => !theirs.includes(card));
      for (const rest of combos(left, toCome)) play(theirs, rest);
    }
  } else {
    for (let i = 0; i < samples; i++) {
      const drawn = shuffle(unseen, random).slice(0, toCome + (against ? 0 : 2));
      play(against ?? drawn.slice(toCome), drawn.slice(0, toCome));
    }
  }
  return { share: (100 * won) / total, exact: cases <= MOST_CASES };
}
