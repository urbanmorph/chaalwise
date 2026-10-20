import { deck, rankOf, type Card } from './cards';
import { CATEGORIES, evaluate, type Category } from './evaluate';

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
