import { describe, expect, it } from 'vitest';
import { deck, type Card } from '@chaalwise/poker/cards';
import { compare, evaluate } from '@chaalwise/poker/evaluate';
import { equity, exactChance, outs } from '@chaalwise/poker/odds';
import { cardIssues, type StepCards } from '../src/lib/poker/step-cards';
import { corpus } from './content';

describe('cards on a step', () => {
  it('passes a table where every card is dealt once', () => {
    expect(
      cardIssues({ hole: ['As', 'Kd'], board: ['Qh', '7c', '2s'], others: [{ name: 'Bot', cards: ['9d', '9c'] }] }),
    ).toEqual([]);
  });

  it('fails a card dealt twice, as no deck holds two of a card', () => {
    expect(cardIssues({ hole: ['As', 'Kd'], board: ['As', '7c', '2s'] })).toEqual([
      { path: ['cards'], message: 'As is dealt twice' },
    ]);
  });

  it('fails a board of one or two cards: the shared cards come three, then one, then one', () => {
    expect(cardIssues({ hole: ['As', 'Kd'], board: ['Qh', '7c'] })).toEqual([
      { path: ['cards', 'board'], message: 'the shared cards are none, three, four or five' },
    ]);
  });
});

/**
 * What the poker lessons claim, worked out by the engine: the lesson text is
 * written by people, the cards decide (as the chess lessons are checked with chessops).
 */
describe('what the poker lessons claim', () => {
  const cardsOf = (id: string) => (corpus.get(`poker/${id}`)!.cards ?? {}) as StepCards;
  const hand = (id: string) => {
    const { hole = [], board = [] } = cardsOf(id);
    return evaluate([...hole, ...board] as Card[]);
  };
  const theirs = (id: string) => {
    const { board = [], others = [] } = cardsOf(id);
    return evaluate([...others[0]!.cards, ...board] as Card[]);
  };
  /** Every two-card hand an opponent could hold, with the cards in sight taken out. */
  const holdings = (seen: string[]) => {
    const unseen = deck().filter((c) => !seen.includes(c));
    return unseen.flatMap((a, i) => unseen.slice(i + 1).map((b) => [a, b] as Card[]));
  };
  const beating = (hole: string[], board: string[]) => {
    const mine = evaluate([...hole, ...board] as Card[]);
    return holdings([...hole, ...board]).filter((h) => compare(evaluate([...h, ...board] as Card[]), mine) > 0);
  };

  it('reads each hand as the lesson says', () => {
    expect(hand('hand-rankings/flush-or-straight').category).toBe('flush');
    expect(hand('hand-rankings/full-house-or-flush').category).toBe('full-house');
    expect(theirs('hand-rankings/full-house-or-flush').category).toBe('flush');
    expect(
      compare(hand('hand-rankings/full-house-or-flush'), theirs('hand-rankings/full-house-or-flush')),
    ).toBeGreaterThan(0);
    expect(hand('hand-rankings/kicker').category).toBe('pair');
    expect(compare(hand('hand-rankings/kicker'), theirs('hand-rankings/kicker'))).toBeGreaterThan(0);
    expect(compare(hand('hand-rankings/board-plays'), theirs('hand-rankings/board-plays'))).toBe(0);
    expect(hand('hand-rankings/two-pair').name).toMatch(/two pair, nines and fives/);
    expect(hand('why-you-bet/bluff').category).toBe('high-card');
    expect(hand('why-you-bet/middling').category).toBe('pair');
  });

  it('counts the outs and chances the lessons give', () => {
    const { hole = [], board = [] } = cardsOf('outs-and-odds/open-ended');
    expect(outs(hole as Card[], board as Card[])).toMatchObject({ count: 8, drawing: 'straight' });
    const draw = cardsOf('outs-and-odds/fold-the-draw');
    expect(outs(draw.hole as Card[], draw.board as Card[])).toMatchObject({ count: 9, drawing: 'flush' });
    expect(Math.round(exactChance(9, 47, 2))).toBe(35);
    expect(Math.round(exactChance(9, 46, 1))).toBe(20);
    expect(Math.round((100 * draw.toCall!) / (draw.pot! + draw.toCall!))).toBe(44);
    const cheap = cardsOf('outs-and-odds/call-the-draw');
    expect(Math.round((100 * cheap.toCall!) / (cheap.pot! + cheap.toCall!))).toBe(9);
    const odds = cardsOf('outs-and-odds/pot-odds');
    expect(odds.toCall! / (odds.pot! + odds.toCall!)).toBe(0.25);
  });

  it('names the best possible hand only where nothing beats it', () => {
    const { board = [] } = cardsOf('reading-the-board/the-nuts');
    const best = holdings(board).map((h) => ({ h, value: evaluate([...h, ...board] as Card[]) }));
    const top = Math.max(...best.map((b) => b.value.score));
    const nuts = best.filter((b) => b.value.score === top);
    expect(nuts.every((b) => b.value.category === 'flush' && b.h.includes('As'))).toBe(true);
    const value = cardsOf('why-you-bet/value');
    expect(beating(value.hole!, value.board!)).toEqual([]);
  });

  it('shows the flush losing its place when the board pairs', () => {
    const { hole = [], board = [] } = cardsOf('reading-the-board/paired-board');
    expect(beating(hole, board.slice(0, 4))).toEqual([]);
    expect(beating(hole, board).length).toBeGreaterThan(0);
  });

  it('finds the four of hearts the most dangerous of the four cards', () => {
    const { hole = [], board = [] } = cardsOf('reading-the-board/dangerous-card');
    const threats = Object.fromEntries(
      ['4h', '2c', 'Ks', 'Ad'].map((card) => [card, beating(hole, [...board, card]).length]),
    );
    expect(Math.max(...Object.values(threats))).toBe(threats['4h']);
  });

  it('checks the review questions on hands and outs', () => {
    expect(hand('hand-rankings/three-of-a-kind').category).toBe('three-of-a-kind');
    expect(compare(hand('hand-rankings/three-of-a-kind'), theirs('hand-rankings/three-of-a-kind'))).toBeGreaterThan(0);
    expect(hand('hand-rankings/wheel').name).toMatch(/straight, five high/);
    expect(
      compare(hand('hand-rankings/flush-against-flush'), theirs('hand-rankings/flush-against-flush')),
    ).toBeGreaterThan(0);
    expect(theirs('hand-rankings/flush-against-flush').category).toBe('flush');
    const inside = cardsOf('outs-and-odds/inside-straight');
    expect(outs(inside.hole as Card[], inside.board as Card[])).toMatchObject({ count: 4, drawing: 'straight' });
    const both = cardsOf('outs-and-odds/two-draws');
    expect(outs(both.hole as Card[], both.board as Card[])).toMatchObject({ count: 15, drawing: 'flush or straight' });
    const price = cardsOf('outs-and-odds/price');
    expect(price.toCall! / (price.pot! + price.toCall!)).toBe(0.25);
  });

  it('works out the equity the ranges lesson gives, against each hand and the range', () => {
    const { hole = [], board = [] } = cardsOf('ranges-and-equity/against-aces');
    const vs = (id: string) =>
      equity(hole as Card[], board as Card[], { against: cardsOf(id).others![0]!.cards as Card[] });
    const aces = vs('ranges-and-equity/against-aces');
    const kings = vs('ranges-and-equity/against-kicker');
    expect(aces.exact && kings.exact).toBe(true);
    expect(Math.round(aces.share)).toBe(11);
    expect(Math.round(kings.share)).toBe(93);
    expect(Math.round((aces.share + kings.share) / 2)).toBe(52);
    expect(cardsOf('ranges-and-equity/both-hands').board).toEqual(board);
  });

  it('counts the implied odds the lesson gives', () => {
    const { pot = 0, toCall = 0 } = cardsOf('implied-odds/paid-later');
    expect(Math.round((100 * toCall) / (pot + toCall + 8))).toBe(18);
  });
});
