import { equity } from '@chaalwise/poker/odds';
import type { Random } from '@chaalwise/poker/random';
import { legalMoves, toCall, type Move, type Street, type Table } from '@chaalwise/poker/table';

/**
 * The practice tables' coach: at each decision, the chance of winning against
 * any two cards, the price of a call, and what the maths suggests. A guide, not
 * a rule: the computer's styles mean a real opponent's cards are rarely random.
 */

/** A hand this strong (percent of the pot won on average) is worth a bet or a raise. */
const STRONG = 60;

export interface Advice {
  /** The chance of winning, in percent of the pot, against any two cards. */
  equity: number;
  /** The call as a share of the pot after it, in percent; 0 when checking is free. */
  price: number;
  suggest: Move;
  why: string;
}

export interface Decision extends Advice {
  street: Street;
  move: Move;
  agreed: boolean;
}

/** What the maths suggests: fold when the chance is below the price, raise or bet a strong hand, otherwise call or check. */
export function suggestion({
  equity,
  toCall,
  pot,
  moves,
}: {
  equity: number;
  toCall: number;
  pot: number;
  moves: Move[];
}): Advice {
  const chance = `Your hand wins about ${Math.round(equity)}% against any two cards.`;
  const price = toCall ? Math.round((100 * toCall) / (pot + toCall)) : 0;
  const can = (move: Move) => moves.includes(move);
  if (toCall) {
    const cost = `${chance} A call costs ${toCall} to play for ${pot + toCall}: ${price}% of the pot.`;
    if (equity < price)
      return { equity, price, suggest: 'fold', why: `${cost} The chance is below the price, so the maths says fold.` };
    if (equity >= STRONG && can('raise'))
      return { equity, price, suggest: 'raise', why: `${cost} A hand this strong is worth raising.` };
    return {
      equity,
      price,
      suggest: 'call',
      why: `${cost} The chance is above the price, so the call pays over many hands.`,
    };
  }
  if (equity >= STRONG && (can('bet') || can('raise')))
    return {
      equity,
      price,
      suggest: can('bet') ? 'bet' : 'raise',
      why: `${chance} Nobody has bet: a strong hand bets, so worse hands can pay.`,
    };
  return {
    equity,
    price,
    suggest: 'check',
    why: `${chance} Checking is free, and a bet would mostly be called by better hands.`,
  };
}

/** Advice for the seat to act, worked out from its cards and the shared cards. */
export function advise(table: Table, random: Random): Advice {
  const seat = table.seats[table.toAct]!;
  return suggestion({
    equity: equity(seat.cards, table.board, { random, samples: 1500 }).share,
    toCall: toCall(table),
    pot: table.pot,
    moves: legalMoves(table),
  });
}

/** A decision as made, beside what the maths suggested at that moment (the advice already shown, if it was). */
export function review(table: Table, move: Move, random: Random, shown?: Advice): Decision {
  const advice = shown ?? advise(table, random);
  return { ...advice, street: table.street, move, agreed: move === advice.suggest };
}
