import { describe, expect, it } from 'vitest';
import { deck, type Card } from '@chaalwise/poker/cards';
import { compare, evaluate } from '@chaalwise/poker/evaluate';
import { equity, exactChance, outs } from '@chaalwise/poker/odds';
import { botMove } from '@chaalwise/poker/bots';
import { seeded } from '@chaalwise/poker/random';
import { act, newHand, stackDeck, type Table } from '@chaalwise/poker/table';
import { cardIssues, type StepCards } from '../src/lib/poker/step-cards';
import { corpus, lessonsIn } from './content';

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

  it('counts the outs and the price in the strategy lesson on weighing a chance against its price', () => {
    const { hole = [], board = [], pot = 0, toCall = 0 } = cardsOf('chance-and-price/flush-draw');
    expect(outs(hole as Card[], board as Card[])).toMatchObject({ count: 9, drawing: 'flush' });
    // Nine spades among the 46 cards you cannot see: about one time in five.
    expect(Math.round(exactChance(9, 46, 1))).toBe(20);
    // A call of 10 into a pot of 30 plays for 40: a quarter.
    expect([pot, toCall]).toEqual([30, 10]);
    expect(toCall / (pot + toCall)).toBe(0.25);
    expect(100 * (toCall / (pot + toCall))).toBeGreaterThan(exactChance(9, 46, 1));
    // The feedback says a call of 5 would be worth it: 5 of 35, about 14%, is less than the flush's chance.
    expect(100 * (5 / (pot + 5))).toBeLessThan(exactChance(9, 46, 1));
  });

  it('works out the strategy lesson on ranges: which of the three hands you beat, and your share against all three', () => {
    const { hole = [], board = [] } = cardsOf('more-than-one-guess/careful-raise');
    const mine = evaluate([...hole, ...board] as Card[]);
    const range: Card[][] = [
      ['8s', '8c'],
      ['Ad', 'Kc'],
      ['Kd', 'Jd'],
    ];
    for (const hand of range) expect(hand.some((c) => [...hole, ...board].includes(c))).toBe(false);
    const beaten = range.map((hand) => compare(mine, evaluate([...hand, ...board] as Card[])) > 0);
    expect(beaten).toEqual([false, false, true]);
    expect(evaluate([...range[0]!, ...board] as Card[]).category).toBe('three-of-a-kind');
    const shares = range.map((against) => equity(hole as Card[], board as Card[], { against }));
    expect(shares.every((e) => e.exact)).toBe(true);
    expect(shares.map((e) => Math.round(e.share))).toEqual([0, 7, 93]);
    expect(Math.round(shares.reduce((sum, e) => sum + e.share, 0) / 3)).toBe(33);
  });

  it('counts the hands that tell the story of the third heart in the strategy lesson on signals', () => {
    const { hole = [], board = [] } = cardsOf('a-bet-tells-a-story/third-heart');
    expect(hand('a-bet-tells-a-story/third-heart').name).toBe('a pair of kings');
    // Two hearts showed on the flop and the turn; the river brings the third.
    expect(board.slice(0, 4).filter((c) => c.endsWith('h'))).toHaveLength(2);
    expect(board[4]!.endsWith('h')).toBe(true);
    const twoHearts = holdings([...hole, ...board]).filter((h) => h.every((c) => c.endsWith('h')));
    expect(twoHearts).toHaveLength(45);
    const flushes = beating(hole, board).filter((h) => evaluate([...h, ...board] as Card[]).category === 'flush');
    expect(flushes).toEqual(twoHearts);
  });

  it('explains Ravi’s calls by his cards and the price in the strategy lesson on blaming the situation first', () => {
    const { board = [], others = [] } = cardsOf('blame-the-situation-first/ravis-call');
    const ravi = others[0]!.cards as Card[];
    const turn = board.slice(0, 4) as Card[];
    // Before the last card Ravi had no pair: only four cards in a row, waiting for a king or an eight.
    expect(evaluate([...ravi, ...turn]).category).toBe('high-card');
    expect(outs(ravi, turn)).toMatchObject({ count: 8, drawing: 'straight' });
    // From his seat, 46 cards are unseen: the straight comes about 17% of the time.
    expect(Math.round(exactChance(8, 46, 1))).toBe(17);
    // Your bet of 4 made the pot 24, so his call cost 4 to play for 28: about 14%, less than his chance.
    expect(Math.round((100 * 4) / 28)).toBe(14);
    expect((100 * 4) / 28).toBeLessThan(exactChance(8, 46, 1));
    // The eight came: his straight beats your two aces.
    expect(board[4]).toMatch(/^8/);
    expect(evaluate([...ravi, ...board] as Card[]).category).toBe('straight');
    expect(hand('blame-the-situation-first/ravis-call').name).toBe('a pair of aces');
    expect(
      compare(evaluate([...ravi, ...board] as Card[]), hand('blame-the-situation-first/ravis-call')),
    ).toBeGreaterThan(0);
  });

  it('shows that a steady player calls a bluff with any pair in the strategy lesson on what others want', () => {
    const { hole = [], board = [] } = cardsOf('they-dont-want-what-you-want/bluff-meena');
    const mine = evaluate([...hole, ...board] as Card[]);
    // Your two spades found two more on the board, one short of a flush: no pair, no flush.
    expect([...hole, ...board].filter((c) => c.endsWith('s'))).toHaveLength(4);
    expect(mine.category).toBe('high-card');
    const pairs = holdings([...hole, ...board]).filter(
      (h) => evaluate([...h, ...board] as Card[]).category !== 'high-card',
    );
    expect(pairs.length).toBeGreaterThan(400);
    // Heads-up, you are the dealer (on the button) and act last after the flop; Meena checks each round, you check too, and on the last card you bet.
    const river = (theirs: Card[]): Table => {
      let t = newHand(
        [
          { name: 'You', points: 200, isBot: false },
          { name: 'Meena', points: 200, isBot: true },
        ],
        0,
        stackDeck([hole as Card[], theirs], board as Card[], 0),
      );
      t = act(act(t, 'call'), 'check');
      for (let street = 0; street < 2; street++) t = act(act(t, 'check'), 'check');
      expect(t.street).toBe('river');
      return act(act(t, 'check'), 'bet');
    };
    for (const theirs of pairs) {
      // Every pair beats your hand, and the steady player never folds one to your bet.
      expect(compare(evaluate([...theirs, ...board] as Card[]), mine)).toBeGreaterThan(0);
      const t = river(theirs);
      for (let seed = 1; seed <= 3; seed++) expect(botMove(t, 1, 'steady', seeded(seed))).not.toBe('fold');
    }
  });

  it('shows the same cards on each strategy lesson’s poker moment, its question and its comparison', () => {
    const moments = {
      'chance-and-price': 'flush-draw',
      'more-than-one-guess': 'careful-raise',
      'a-bet-tells-a-story': 'third-heart',
      'blame-the-situation-first': 'ravis-call',
      'they-dont-want-what-you-want': 'bluff-meena',
    };
    const strategy = lessonsIn('strategy');
    for (const [lesson, question] of Object.entries(moments)) {
      const read = strategy.find((l) => l.file === `${lesson}.md`)!.data.steps[0] as { cards?: StepCards };
      expect(read.cards, lesson).toEqual(cardsOf(`${lesson}/${question}`));
      expect(cardsOf(`${lesson}/compare`), lesson).toEqual(cardsOf(`${lesson}/${question}`));
    }
  });
});
