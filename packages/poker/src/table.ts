import { deck as fullDeck, type Card } from './cards';
import { evaluate, type HandValue } from './evaluate';

/**
 * Fixed-limit Texas Hold'em for 2 to 4 seats, played for practice points only.
 *
 * Blinds are 1 and 2 points. A bet or raise is 2 points before the flop and on the
 * flop, 4 on the turn and river, and a round allows at most four bets (a bet and
 * three raises). There are no burn cards, so a stacked deck reads in deal order.
 *
 * All-in is not modelled. A seat needs at least MIN_POINTS to sit in a hand, which
 * is the most one seat can put in under these limits, so no seat can ever run out
 * mid-hand and there are never side pots. Top a seat back up between hands.
 */

export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
export type Move = 'fold' | 'check' | 'call' | 'bet' | 'raise';

export interface Seat {
  name: string;
  points: number;
  cards: Card[];
  folded: boolean;
  /** Points put in during this betting round. */
  inRound: number;
  /** Points put in during this hand. */
  inHand: number;
  isBot: boolean;
}

export interface LogEntry {
  seat: number;
  move: Move;
  street: Street;
  /** Points this move put in. */
  amount: number;
}

export interface Result {
  /** Winning seats, in order from the dealer's left. */
  winners: number[];
  /** The whole pot, shared between the winners. */
  won: number;
  /** Each seat's hand if it reached the showdown, otherwise undefined. */
  hands: (HandValue | undefined)[];
  /** True when everyone else folded. */
  byFold: boolean;
}

export interface Table {
  seats: Seat[];
  board: Card[];
  pot: number;
  street: Street;
  dealer: number;
  /** The seat to act; -1 once the hand is over. */
  toAct: number;
  /** Cards still to deal, dealt from the front. */
  deck: Card[];
  /** Bets so far this round; the big blind counts as the first before the flop. */
  bets: number;
  log: LogEntry[];
  result?: Result;
}

export interface Player {
  name: string;
  points: number;
  isBot: boolean;
}

export const SMALL_BLIND = 1;
export const BIG_BLIND = 2;
/** A bet and three raises. */
export const MAX_BETS = 4;
/** The most one seat can put in a hand: four bets on each street, 4 × (2 + 2 + 4 + 4). */
export const MIN_POINTS = MAX_BETS * (2 + 2 + 4 + 4);
/** A sensible stack for a new seat. */
export const STARTING_POINTS = 200;

const NEXT_STREET = { preflop: 'flop', flop: 'turn', turn: 'river' } as const;

/** The size of a bet or raise on a street. */
export const betSize = (street: Street): number => (street === 'preflop' || street === 'flop' ? 2 : 4);

/** Seat numbers going round the table, starting left of the given seat and ending with it. */
const around = (count: number, from: number): number[] =>
  Array.from({ length: count }, (_, i) => (from + 1 + i) % count);

/** The next seat still in the hand, left of the given seat. */
const nextActive = (table: Table, from: number): number =>
  around(table.seats.length, from).find((i) => !table.seats[i]!.folded)!;

function pay(table: Table, seat: number, amount: number): void {
  const s = table.seats[seat]!;
  s.points -= amount;
  s.inRound += amount;
  s.inHand += amount;
  table.pot += amount;
}

/** A deck that deals the given hole cards (indexed by seat) and board for a hand with this dealer; the rest follow in order. */
export function stackDeck(holes: Card[][], board: Card[], dealer: number): Card[] {
  const front = [...around(holes.length, dealer).flatMap((i) => holes[i]!), ...board];
  if (new Set(front).size !== front.length) throw new Error('A card appears twice');
  return [...front, ...fullDeck().filter((card) => !front.includes(card))];
}

/**
 * Deals a new hand: two cards to each seat in turn, starting left of the dealer,
 * then posts the blinds. Heads-up, the dealer posts the small blind and acts first
 * before the flop; with three or four seats the blinds sit left of the dealer and
 * the seat after the big blind acts first.
 */
export function newHand(players: Player[], dealer: number, cards: Card[]): Table {
  const count = players.length;
  if (count < 2 || count > 4) throw new Error(`A table seats 2 to 4 players, not ${count}`);
  if (dealer < 0 || dealer >= count) throw new Error(`No seat ${dealer} to deal from`);
  if (cards.length < count * 2 + 5) throw new Error('Not enough cards to deal a hand');
  const short = players.find((p) => p.points < MIN_POINTS);
  if (short) throw new Error(`${short.name} needs at least ${MIN_POINTS} points to play a hand`);

  const seats: Seat[] = players.map(({ name, points, isBot }) => ({
    name,
    points,
    isBot,
    cards: [],
    folded: false,
    inRound: 0,
    inHand: 0,
  }));
  around(count, dealer).forEach((seat, i) => (seats[seat]!.cards = cards.slice(i * 2, i * 2 + 2)));

  const table: Table = {
    seats,
    board: [],
    pot: 0,
    street: 'preflop',
    dealer,
    toAct: 0,
    deck: cards.slice(count * 2),
    bets: 1,
    log: [],
  };
  const small = count === 2 ? dealer : (dealer + 1) % count;
  const big = (small + 1) % count;
  pay(table, small, SMALL_BLIND);
  pay(table, big, BIG_BLIND);
  table.toAct = (big + 1) % count;
  return table;
}

/** Points the seat to act needs to put in to stay in. */
export function toCall(table: Table): number {
  const most = Math.max(...table.seats.map((s) => s.inRound));
  return most - (table.seats[table.toAct]?.inRound ?? most);
}

/** The moves open to the seat to act; none once the hand is over. Folding is not offered when checking is free. */
export function legalMoves(table: Table): Move[] {
  if (table.result) return [];
  const canRaise = table.bets < MAX_BETS;
  if (toCall(table) > 0) return canRaise ? ['fold', 'call', 'raise'] : ['fold', 'call'];
  if (table.bets === 0) return ['check', 'bet'];
  return canRaise ? ['check', 'raise'] : ['check'];
}

export const isOver = (table: Table): boolean => table.result !== undefined;

/** Shares the pot among the winners; odd points go one each to the winners nearest the dealer's left. */
function settle(table: Table, winners: number[], hands: (HandValue | undefined)[], byFold: boolean): void {
  const won = table.pot;
  const share = Math.floor(won / winners.length);
  winners.forEach((seat, i) => (table.seats[seat]!.points += share + (i < won % winners.length ? 1 : 0)));
  table.pot = 0;
  table.toAct = -1;
  table.result = { winners, won, hands, byFold };
}

function showdown(table: Table): void {
  table.street = 'showdown';
  const hands = table.seats.map((s) => (s.folded ? undefined : evaluate([...s.cards, ...table.board])));
  const top = Math.max(...hands.map((hand) => hand?.score ?? -1));
  const winners = around(table.seats.length, table.dealer).filter((i) => hands[i]?.score === top);
  settle(table, winners, hands, false);
}

/** True when every seat still in has acted this round and matched the biggest bet. */
function roundDone(table: Table): boolean {
  const most = Math.max(...table.seats.map((s) => s.inRound));
  return table.seats.every(
    (s, i) =>
      s.folded || (s.inRound === most && table.log.some((entry) => entry.seat === i && entry.street === table.street)),
  );
}

function nextStreet(table: Table): void {
  if (table.street === 'river') return showdown(table);
  const street = NEXT_STREET[table.street as keyof typeof NEXT_STREET];
  const dealt = street === 'flop' ? 3 : 1;
  table.board.push(...table.deck.slice(0, dealt));
  table.deck = table.deck.slice(dealt);
  table.street = street;
  table.bets = 0;
  for (const s of table.seats) s.inRound = 0;
  table.toAct = nextActive(table, table.dealer);
}

/**
 * Plays a move for the seat to act and returns the new table; the table passed in
 * is not changed. Deals the next street when a round ends, and settles the pot
 * when one player is left or the river round ends. Throws on an illegal move.
 */
export function act(table: Table, move: Move): Table {
  if (!legalMoves(table).includes(move)) throw new Error(`${move} is not a legal move now`);
  const t = structuredClone(table);
  const seat = t.toAct;
  const amount = { fold: 0, check: 0, call: toCall(t), bet: betSize(t.street), raise: toCall(t) + betSize(t.street) }[
    move
  ];
  if (move === 'fold') t.seats[seat]!.folded = true;
  if (move === 'bet' || move === 'raise') t.bets++;
  pay(t, seat, amount);
  t.log.push({ seat, move, street: t.street, amount });

  const left = t.seats.flatMap((s, i) => (s.folded ? [] : [i]));
  if (left.length === 1)
    settle(
      t,
      left,
      t.seats.map(() => undefined),
      true,
    );
  else if (roundDone(t)) nextStreet(t);
  else t.toAct = nextActive(t, seat);
  return t;
}

/** The next hand at the same table: the same players with their points, the dealer one seat to the left. */
export function nextHand(table: Table, cards: Card[]): Table {
  if (!table.result) throw new Error('The hand is not over yet');
  const players = table.seats.map(({ name, points, isBot }) => ({ name, points, isBot }));
  return newHand(players, (table.dealer + 1) % players.length, cards);
}
