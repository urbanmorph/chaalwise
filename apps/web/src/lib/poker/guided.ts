import type { Card } from '@chaalwise/poker/cards';
import { outs, ruleOf } from '@chaalwise/poker/odds';
import {
  act,
  legalMoves,
  newHand,
  stackDeck,
  STARTING_POINTS,
  toCall,
  type Move,
  type Street,
  type Table,
} from '@chaalwise/poker/table';

/**
 * Poker's front door: three guided hands, heads-up against a bot, each with a
 * stacked deck so its lesson always comes up. The coach says what to notice and
 * suggests a move at each of the learner's decisions, but never forces it.
 * Practice points only: free, and never bought, sold or cashed out.
 */

type Coach = { notice: string | ((table: Table) => string); suggest: Move; why: string };

export interface GuidedHand {
  id: string;
  title: string;
  /** Before the cards: what this hand is about. */
  intro: string;
  you: [Card, Card];
  bot: [Card, Card];
  board: [Card, Card, Card, Card, Card];
  /** The seat with the dealer button: 0 is the learner. Heads-up, the dealer posts the small blind and acts first before the flop. */
  dealer: 0 | 1;
  /** The bot's moves on each street, in order; when they run out, it checks if it can, or calls. */
  plan: Partial<Record<Street, Move[]>>;
  /** What the coach says at the learner's first decision on each street. */
  coach: Partial<Record<Street, Coach>>;
  /** After the hand: the idea to take away. */
  lesson: string;
}

export const LEARNER = 0;
export const BOT = 1;
export const PLAYERS = [
  { name: 'You', points: STARTING_POINTS, isBot: false },
  { name: 'Bot', points: STARTING_POINTS, isBot: true },
];

export const GUIDED: GuidedHand[] = [
  {
    id: 'how-a-hand-runs',
    title: 'How a hand runs',
    intro:
      'Each player gets two cards that only they can see. Five shared cards come face up in the middle, over three rounds. Your hand is the best five of your two and the shared five. Before the cards, two players put in a small forced bet, the blinds, so there is something to play for.',
    you: ['As', 'Ks'],
    bot: ['Qd', 'Qc'],
    board: ['Kh', '7c', '2d', '9s', '4h'],
    dealer: 0,
    plan: { preflop: ['call'], flop: ['check', 'call'], turn: ['check', 'call'], river: ['check', 'call'] },
    coach: {
      preflop: {
        notice:
          'You have the ace and king of spades, one of the best starting hands. You put in the small blind of 1 point; the bot put in the big blind of 2.',
        suggest: 'raise',
        why: 'With a strong hand, raise: put in more, so the bot has to pay to see the shared cards.',
      },
      flop: {
        notice:
          'The flop: three shared cards. The king pairs your king, so you have a pair of kings, with an ace beside it.',
        suggest: 'bet',
        why: 'A pair of kings is very likely the best hand here. Bet, so a worse hand pays to stay in.',
      },
      turn: {
        notice: 'The turn: a fourth shared card. The nine changes nothing for you.',
        suggest: 'bet',
        why: 'You are still likely ahead. Keep betting: bets are 4 points from here.',
      },
      river: {
        notice: 'The river: the last shared card. Your hand is now final: a pair of kings.',
        suggest: 'bet',
        why: 'Bet once more. If the bot calls, both hands are shown, and the best five cards win the pot.',
      },
    },
    lesson:
      'At the showdown your pair of kings beat the bot’s pair of queens: a higher pair wins. Every hand runs this way: blinds, two cards each, then betting before the flop, on the flop, the turn and the river.',
  },
  {
    id: 'folding-is-a-move',
    title: 'Folding is a good move',
    intro:
      'The weakest hands are not worth playing. Giving one up early, before it costs you, is part of playing well.',
    you: ['7c', '2d'],
    bot: ['Ah', 'Ad'],
    board: ['Js', 'Jh', '5c', 'Qd', '9s'],
    dealer: 0,
    plan: { preflop: ['raise'], flop: ['bet'], turn: ['bet'], river: ['bet'] },
    coach: {
      preflop: {
        notice:
          'Seven and two of different suits: one of the weakest starting hands there is. They are far apart, too low, and cannot make a flush together.',
        suggest: 'fold',
        why: 'Fold now. It costs only the 1 point you put in as the small blind, instead of points you would lose later.',
      },
    },
    lesson:
      'You lost 1 point instead of many. The bot had a pair of aces. Folding weak hands early is not giving up: it saves your points for hands that can win.',
  },
  {
    id: 'counting-outs',
    title: 'Count your outs',
    intro:
      'Sometimes your hand is not good yet, but could become very good. Then the question is: how likely is it to come in, and what does it cost to wait?',
    you: ['9h', '8h'],
    bot: ['Ks', 'Qc'],
    board: ['7h', '2h', 'Kc', 'Ah', '3s'],
    dealer: 0,
    plan: { preflop: ['check'], flop: ['bet', 'call'], turn: ['bet', 'call'], river: ['check', 'call'] },
    coach: {
      preflop: {
        notice:
          'Nine and eight of hearts: two cards next to each other in the same suit. Not strong now, but they can grow into a straight or a flush.',
        suggest: 'call',
        why: 'Calling costs only 1 more point to see the flop. A cheap look is worth it with cards that can grow.',
      },
      flop: {
        notice: (table) => {
          const o = outs(table.seats[LEARNER]!.cards, table.board);
          return `You have four hearts. One more heart makes a flush. There are ${o.count} hearts left, your ${o.count} outs. By the rule of 2 and 4, the next card gives about ${ruleOf(o.count, 1)}% (outs × 2), and about ${ruleOf(o.count, 2)}% by the river if you see both cards (outs × 4). The bot bet ${toCall(table)} into a pot of ${table.pot - toCall(table)}.`;
        },
        suggest: 'call',
        why: 'Call. The price is a little more than the chance the next card gives. But if the flush comes, the bets still to come can win you much more. The bot probably has the king.',
      },
      turn: {
        notice: 'The ace of hearts: your flush has come in. Five hearts beat a pair of kings.',
        suggest: 'raise',
        why: 'You now likely have the best hand. Raise, so the bot puts more in.',
      },
      river: {
        notice: 'The three of spades changes nothing. You still have a flush.',
        suggest: 'bet',
        why: 'Bet again for value: a pair of kings may well call.',
      },
    },
    lesson:
      'Your flush beat the bot’s pair of kings. Counting outs tells you how likely a draw is; the rule of 2 and 4 turns outs into a rough chance. Compare that with what a call costs, and you know whether waiting is worth it.',
  },
];

/** The guided hand's table, before anyone has acted. */
export const startGuided = (index: number): Table => {
  const hand = GUIDED[index]!;
  return newHand(PLAYERS, hand.dealer, stackDeck([hand.you, hand.bot], hand.board, hand.dealer));
};

/** The learner's move. */
export const step = (table: Table, move: Move): Table => act(table, move);

/** The bot's next move on this street, from its plan: checking if it can, or calling, once the plan runs out. */
function botPlanned(table: Table, hand: GuidedHand): Move {
  const done = table.log.filter((e) => e.seat === BOT && e.street === table.street).length;
  const planned = hand.plan[table.street]?.[done];
  const legal = legalMoves(table);
  if (planned && legal.includes(planned)) return planned;
  return legal.includes('check') ? 'check' : 'call';
}

/** Let the bot play until it is the learner's turn, or the hand is over. */
export function learnerTurn(table: Table, hand: GuidedHand): Table {
  let next = table;
  while (!next.result && next.toAct === BOT) next = act(next, botPlanned(next, hand));
  return next;
}

/** What the coach says at the learner's decision: the street's note the first time, plain advice after that. */
export function coachFor(table: Table, hand: GuidedHand): { notice: string; suggest: Move; why: string } {
  const first = !table.log.some((e) => e.seat === LEARNER && e.street === table.street);
  const coach = first ? hand.coach[table.street] : undefined;
  if (coach && legalMoves(table).includes(coach.suggest))
    return {
      notice: typeof coach.notice === 'string' ? coach.notice : coach.notice(table),
      suggest: coach.suggest,
      why: coach.why,
    };
  const owe = toCall(table);
  return owe
    ? {
        notice: `The bot raised. Calling costs ${owe} more points.`,
        suggest: 'call',
        why: 'Call to see the hand through; with a strong hand you could raise again.',
      }
    : { notice: 'Nothing to call.', suggest: 'check', why: 'Checking is free: you stay in without putting more in.' };
}
