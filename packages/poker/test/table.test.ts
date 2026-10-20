import { describe, expect, it } from 'vitest';
import { deck, shuffle, type Card } from '../src/cards';
import { seeded } from '../src/random';
import {
  act,
  betSize,
  isOver,
  legalMoves,
  MIN_POINTS,
  newHand,
  nextHand,
  stackDeck,
  toCall,
  type Move,
  type Table,
} from '../src/table';

const c = (text: string) => text.split(' ') as Card[];
const players = (n: number, points = 200) =>
  Array.from({ length: n }, (_, i) => ({ name: `P${i}`, points, isBot: i > 0 }));
const play = (table: Table, ...moves: Move[]) => moves.reduce(act, table);
const total = (table: Table) => table.seats.reduce((sum, seat) => sum + seat.points, 0) + table.pot;

describe('new hand: blinds and first to act', () => {
  it('heads-up: the dealer posts the small blind and acts first before the flop', () => {
    const t = newHand(players(2), 0, deck());
    expect(t.seats.map((s) => s.inRound)).toEqual([1, 2]);
    expect(t.seats.map((s) => s.points)).toEqual([199, 198]);
    expect(t.pot).toBe(3);
    expect(t.toAct).toBe(0);
    expect(t.bets).toBe(1);
    expect(t.street).toBe('preflop');
    expect(toCall(t)).toBe(1);
    expect(legalMoves(t)).toEqual(['fold', 'call', 'raise']);
  });

  it('heads-up: the dealer acts last after the flop', () => {
    const t = play(newHand(players(2), 1, deck()), 'call', 'check');
    expect(t.street).toBe('flop');
    expect(t.toAct).toBe(0);
  });

  it('three seats: small blind left of the dealer, big blind next, then the third seat acts', () => {
    const t = newHand(players(3), 2, deck());
    expect(t.seats.map((s) => s.inRound)).toEqual([1, 2, 0]);
    expect(t.toAct).toBe(2);
  });

  it('four seats: first to act is left of the big blind', () => {
    const t = newHand(players(4), 1, deck());
    expect(t.seats.map((s) => s.inRound)).toEqual([0, 0, 1, 2]);
    expect(t.toAct).toBe(0);
  });

  it('deals two cards to each seat starting left of the dealer, from the front of the deck', () => {
    const cards = deck();
    const t = newHand(players(3), 0, cards);
    expect(t.seats[1]!.cards).toEqual(cards.slice(0, 2));
    expect(t.seats[2]!.cards).toEqual(cards.slice(2, 4));
    expect(t.seats[0]!.cards).toEqual(cards.slice(4, 6));
    expect(t.deck).toEqual(cards.slice(6));
  });

  it('stacks a deck so each seat gets the cards asked for', () => {
    const holes = [c('As Ad'), c('7c 2d'), c('Kh Qh')];
    const board = c('Ac 9s 4h 3c 2s');
    const cards = stackDeck(holes, board, 1);
    expect(new Set(cards).size).toBe(52);
    const t = newHand(players(3), 1, cards);
    expect(t.seats.map((s) => s.cards)).toEqual(holes);
    expect(t.deck.slice(0, 5)).toEqual(board);
  });

  it('refuses a seat with too few points, and fewer than two or more than four seats', () => {
    expect(() => newHand([...players(1), { name: 'Short', points: MIN_POINTS - 1, isBot: true }], 0, deck())).toThrow();
    expect(() => newHand(players(1), 0, deck())).toThrow();
    expect(() => newHand(players(5), 0, deck())).toThrow();
  });
});

describe('betting rounds', () => {
  it('bets 2 points before the flop and on the flop, 4 on the turn and river', () => {
    expect(['preflop', 'flop', 'turn', 'river'].map((s) => betSize(s as Table['street']))).toEqual([2, 2, 4, 4]);
  });

  it('gives the big blind the option when everyone calls', () => {
    const t = play(newHand(players(3), 0, deck()), 'call', 'call');
    expect(t.toAct).toBe(2);
    expect(legalMoves(t)).toEqual(['check', 'raise']);
    expect(play(t, 'check').street).toBe('flop');
  });

  it('checks around to the showdown', () => {
    let t = play(newHand(players(2), 0, deck()), 'call', 'check');
    expect(t.board).toHaveLength(3);
    expect(legalMoves(t)).toEqual(['check', 'bet']);
    t = play(t, 'check', 'check');
    expect(t.street).toBe('turn');
    expect(t.board).toHaveLength(4);
    t = play(t, 'check', 'check');
    expect(t.street).toBe('river');
    t = play(t, 'check', 'check');
    expect(t.street).toBe('showdown');
    expect(isOver(t)).toBe(true);
    expect(t.result?.byFold).toBe(false);
    expect(t.result?.won).toBe(4);
    expect(legalMoves(t)).toEqual([]);
  });

  it('bet and call moves to the next street with the right pot', () => {
    let t = play(newHand(players(2), 0, deck()), 'call', 'check');
    t = play(t, 'bet');
    expect(t.pot).toBe(6);
    expect(toCall(t)).toBe(2);
    expect(legalMoves(t)).toEqual(['fold', 'call', 'raise']);
    t = play(t, 'call');
    expect(t.street).toBe('turn');
    expect(t.pot).toBe(8);
    t = play(t, 'bet');
    expect(t.pot).toBe(12);
    expect(t.log.at(-1)).toEqual({ seat: 1, move: 'bet', street: 'turn', amount: 4 });
  });

  it('caps a round at four bets', () => {
    let t = newHand(players(2), 0, deck());
    t = play(t, 'raise', 'raise', 'raise');
    expect(t.bets).toBe(4);
    expect(t.toAct).toBe(1);
    expect(legalMoves(t)).toEqual(['fold', 'call']);
    expect(() => act(t, 'raise')).toThrow();
    t = act(t, 'call');
    expect(t.street).toBe('flop');
    expect(t.pot).toBe(16);
  });

  it('a raise keeps the round open for the players who already acted', () => {
    let t = play(newHand(players(3), 0, deck()), 'call', 'call', 'raise');
    expect(t.street).toBe('preflop');
    expect(t.toAct).toBe(0);
    t = play(t, 'call', 'call');
    expect(t.street).toBe('flop');
    expect(t.pot).toBe(12);
    expect(t.toAct).toBe(1);
  });

  it('skips folded seats', () => {
    const t = play(newHand(players(4), 0, deck()), 'fold', 'call', 'call', 'check');
    expect(t.street).toBe('flop');
    expect(t.toAct).toBe(1);
    expect(play(t, 'check', 'check', 'check').street).toBe('turn');
  });

  it('refuses an illegal move', () => {
    const t = newHand(players(2), 0, deck());
    expect(() => act(t, 'check')).toThrow();
    expect(() => act(t, 'bet')).toThrow();
  });

  it('does not change the table it was given', () => {
    const t = newHand(players(2), 0, deck());
    const copy = structuredClone(t);
    act(t, 'raise');
    expect(t).toEqual(copy);
  });
});

describe('settling the pot', () => {
  it('a fold ends the hand and the last player takes the pot', () => {
    const t = act(newHand(players(2), 0, deck()), 'fold');
    expect(t.result).toEqual({ winners: [1], won: 3, hands: [undefined, undefined], byFold: true });
    expect(t.seats.map((s) => s.points)).toEqual([199, 201]);
    expect(t.pot).toBe(0);
    expect(t.street).toBe('preflop');
  });

  it('plays a stacked hand to the showdown and pays the best hand', () => {
    const holes = [c('Kh Qh'), c('As Ad'), c('7c 2d')];
    const cards = stackDeck(holes, c('Ac 9s 4h 3c 2s'), 0);
    let t = newHand(players(3), 0, cards);
    t = play(t, 'call', 'raise', 'call', 'call'); // seat 0 calls, seat 1 raises to 4, seat 2 calls, seat 0 calls
    expect(t.street).toBe('flop');
    expect(t.pot).toBe(12);
    t = play(t, 'bet', 'fold', 'call'); // seat 1 bets, seat 2 folds, seat 0 calls
    t = play(t, 'bet', 'call'); // turn
    t = play(t, 'bet', 'call'); // river
    expect(t.result?.winners).toEqual([1]);
    expect(t.result?.won).toBe(12 + 4 + 8 + 8);
    expect(t.result?.hands[1]?.name).toBe('three of a kind, aces');
    expect(t.result?.hands[0]?.name).toBe('ace high');
    expect(t.result?.hands[2]).toBeUndefined();
    expect(t.seats.map((s) => s.points)).toEqual([200 - 14, 200 - 14 + 32, 200 - 4]);
  });

  it('splits a tied pot and gives the odd point to the first winner left of the dealer', () => {
    const holes = [c('2c 3d'), c('7c 2d'), c('4c 5d')];
    const cards = stackDeck(holes, c('As Kd Qc Jh Ts'), 0);
    let t = newHand(players(3), 0, cards);
    t = play(t, 'call', 'fold', 'check'); // pot: 2 + 1 + 2 = 5
    t = play(t, 'check', 'check', 'check', 'check', 'check', 'check');
    expect(t.result?.winners).toEqual([2, 0]);
    expect(t.result?.won).toBe(5);
    expect(t.seats.map((s) => s.points)).toEqual([200, 199, 201]);
  });

  it('moves on to the next hand with the dealer one seat on', () => {
    const t = play(newHand(players(3), 2, deck()), 'fold', 'fold');
    expect(t.result?.winners).toEqual([1]);
    const next = nextHand(t, deck());
    expect(next.dealer).toBe(0);
    expect(next.seats.map((s) => s.name)).toEqual(['P0', 'P1', 'P2']);
    expect(next.seats[0]!.points + next.seats[0]!.inHand).toBe(t.seats[0]!.points);
  });

  it('conserves points across many random hands', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const random = seeded(seed);
      const n = 2 + (seed % 3);
      let t = newHand(players(n), seed % n, shuffle(deck(), random));
      const start = total(t);
      while (!t.result) {
        const moves = legalMoves(t);
        t = act(t, moves[Math.floor(random() * moves.length)]!);
        expect(total(t)).toBe(start);
      }
      expect(t.pot).toBe(0);
      expect(t.result.winners.length).toBeGreaterThan(0);
    }
  });
});
