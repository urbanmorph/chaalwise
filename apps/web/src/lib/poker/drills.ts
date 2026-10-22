import { startingScore } from '@chaalwise/poker/bots';
import {
  cardName,
  deck,
  RANKS,
  rankName,
  rankOf,
  rankPlural,
  rankValue,
  shuffle,
  SUITS,
  suitName,
  suitOf,
  type Card,
} from '@chaalwise/poker/cards';
import { CATEGORIES, evaluate, type Category, type HandValue } from '@chaalwise/poker/evaluate';
import { equity, exactChance, outs, ruleOf, type Outs } from '@chaalwise/poker/odds';
import { seeded, type Random } from '@chaalwise/poker/random';
import { shuffle as shuffleList } from '../random';
import type { StepCards } from './step-cards';

/**
 * Daily poker drills: endless exercises the engine deals and checks. Every
 * answer, and every figure an explanation gives, is worked out here from the
 * cards, never written by hand. Each takes a random source, so the same seed,
 * or the same date, gives the same exercise again.
 */

export const POKER_DRILL_KINDS = ['outs', 'pot-odds', 'nuts', 'preflop', 'equity'] as const;
export type PokerDrillKind = (typeof POKER_DRILL_KINDS)[number];

export interface PokerItem {
  kind: PokerDrillKind;
  /** The question, naming poker and explaining its jargon, since it may be shown on its own. */
  prompt: string;
  cards: StepCards;
  /** The answers to choose from; none when the answer is a number to type. */
  options?: string[];
  /** The right option's index, or the number itself. */
  answer: number;
  explanation: string;
}

const percent = (n: number) => `${Math.round(n)}%`;
const capital = (text: string) => text[0]!.toUpperCase() + text.slice(1);
const level = (category: Category) => CATEGORIES.indexOf(category);
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const list = (parts: string[]) =>
  parts.length < 2 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`;
const pick = <T>(items: readonly T[], random: Random): T => items[Math.floor(random() * items.length)]!;

const DRAWING = { flush: 'a flush', straight: 'a straight', 'flush or straight': 'a flush or a straight' } as const;
type Draw = Outs & { drawing: keyof typeof DRAWING };

/** Two hole cards and a flop or turn with a flush or straight draw, and nothing that strong made yet. */
function drawingHand(random: Random, boardSize: 3 | 4): { hole: Card[]; board: Card[]; draw: Draw } {
  for (;;) {
    const [a, b, ...rest] = shuffle(deck(), random);
    const hole = [a!, b!];
    const board = rest.slice(0, boardSize);
    if (level(evaluate([...hole, ...board]).category) >= level('straight')) continue;
    const draw = outs(hole, board);
    if (draw.drawing !== 'pair or better' && draw.count) return { hole, board, draw: draw as Draw };
  }
}

/** Which cards the outs are: the flush suit's unseen cards, and the straight's ranks. */
function outsWords({ cards, drawing }: Draw): string {
  const suit = drawing === 'straight' ? undefined : suitOf(cards[0]!);
  const straight = cards.filter((card) => suitOf(card) !== suit);
  const ranks = [...RANKS]
    .reverse()
    .map((rank) => ({ rank, n: straight.filter((card) => rankOf(card) === rank).length }))
    .filter(({ n }) => n)
    .map(({ rank, n }) => `${n} ${n === 1 ? rankName(rank) : rankPlural(rank)}`);
  const flushWords = suit && `The ${cards.length - straight.length} ${suitName(suit)} still unseen make a flush.`;
  const straightWords =
    straight.length && `Any of the ${list(ranks)}${suit ? ` that are not ${suitName(suit)}` : ''} makes a straight.`;
  return [flushWords, straightWords].filter(Boolean).join(' ');
}

function outsItem(random: Random): PokerItem {
  const toCome = random() < 0.5 ? 2 : 1;
  const { hole, board, draw } = drawingHand(random, toCome === 2 ? 3 : 4);
  const unseen = 52 - hole.length - board.length;
  return {
    kind: 'outs',
    prompt: `In poker, an out is an unseen card that would make your hand. With ${toCome === 2 ? 'two shared cards' : 'one shared card'} still to come, how many outs do you have to ${DRAWING[draw.drawing]}?`,
    cards: { hole, board },
    answer: draw.count,
    explanation: `${plural(draw.count, 'out')}. ${outsWords(draw)} By the rule of ${toCome === 2 ? 'four' : 'two'}, that is about ${ruleOf(draw.count, toCome)}% to come; worked out exactly, ${percent(exactChance(draw.count, unseen, toCome))}.`,
  };
}

/** What a call costs as a share of the pot before it, from a quarter of the pot to the whole pot. */
const BET_SHARES = [1 / 4, 1 / 3, 1 / 2, 2 / 3, 3 / 4, 1];

function potOddsItem(random: Random): PokerItem {
  for (;;) {
    const pot = 4 + Math.floor(random() * 37);
    const toCall = Math.max(1, Math.round(pot * pick(BET_SHARES, random)));
    const price = (100 * toCall) / (pot + toCall);
    const pricing = `In poker, the pot holds ${pot} points and a call costs ${toCall}.`;
    let item: Pick<PokerItem, 'prompt' | 'cards'>;
    let chance: number;
    let chanceWords: string;
    if (random() < 0.6) {
      const { hole, board, draw } = drawingHand(random, 4);
      const unseen = 52 - hole.length - board.length;
      chance = exactChance(draw.count, unseen, 1);
      chanceWords = `With ${plural(draw.count, 'out')} among ${unseen} unseen cards, one comes ${percent(chance)} of the time.`;
      item = {
        prompt: `${pricing} One shared card is still to come, and ${draw.count} unseen cards (your outs) would give you ${DRAWING[draw.drawing]}, which you expect to win with. Call or fold?`,
        cards: { hole, board, pot, toCall },
      };
    } else {
      chance = 5 + Math.floor(random() * 56);
      chanceWords = `You win about ${chance}% of the time.`;
      item = {
        prompt: `${pricing} You expect to win about ${chance}% of the time. Call or fold?`,
        cards: { pot, toCall },
      };
    }
    // Never a coin flip: the chance and the price are clearly apart.
    if (Math.abs(chance - price) < 4) continue;
    const call = chance > price;
    return {
      kind: 'pot-odds',
      ...item,
      options: ['Call', 'Fold'],
      answer: call ? 0 : 1,
      explanation: `${call ? 'Call' : 'Fold'}. A call of ${toCall} plays for ${pot + toCall}: the ${pot} in the pot plus your ${toCall}, so the price is ${percent(price)}. ${chanceWords} The chance is ${call ? 'above the price: over many such hands the calls win more than they cost' : 'below the price: over many such hands the calls would cost more than they win'}.`,
    };
  }
}

function nutsItem(random: Random): PokerItem {
  for (;;) {
    const cards = shuffle(deck(), random);
    const board = cards.slice(0, 5);
    const rest = cards.slice(5);
    // The best hand of each kind any two unseen cards make, and how many pairs make the very best.
    const best = new Map<Category, { hand: HandValue; hole: Card[] }>();
    let top = 0;
    let makers = 0;
    for (let i = 0; i < rest.length; i++)
      for (let j = i + 1; j < rest.length; j++) {
        const hole = [rest[i]!, rest[j]!];
        const hand = evaluate([...hole, ...board]);
        const kept = best.get(hand.category);
        if (!kept || hand.score > kept.hand.score) best.set(hand.category, { hand, hole });
        if (hand.score > top) [top, makers] = [hand.score, 1];
        else if (hand.score === top) makers++;
      }
    const [nuts, ...lower] = [...best.values()].sort((a, b) => b.hand.score - a.hand.score);
    // When the board alone is the best hand, there is nothing to read.
    if (!nuts || lower.length < 2 || nuts.hand.score === evaluate(board).score) continue;
    const options = [nuts, ...lower.slice(0, 3)].map(({ hand }) => capital(hand.name));
    const shuffled = shuffleList(options, random);
    const nutsLevel = level(nuts.hand.category);
    const paired = new Set(board.map(rankOf)).size < 5;
    const suited = SUITS.some((suit) => board.filter((card) => suitOf(card) === suit).length >= 3);
    const reasons = [
      !paired &&
        nutsLevel < level('full-house') &&
        'With no pair on the board, nobody can make a full house or four of a kind.',
      !suited && nutsLevel < level('flush') && 'With no three cards of one suit, nobody can make a flush.',
      nutsLevel < level('straight') && 'No two cards make a straight here.',
    ].filter((reason) => reason !== false);
    const [a, b] = nuts.hole as [Card, Card];
    const others = makers > 1 ? `, as do ${plural(makers - 1, 'other pair')} of cards` : '';
    return {
      kind: 'nuts',
      prompt:
        "In poker, the five shared cards are everyone's: each player adds their own two. Which is the best hand anyone could make with these, the hand called the nuts?",
      cards: { board },
      options: shuffled,
      answer: shuffled.indexOf(options[0]!),
      explanation: [
        `${capital(nuts.hand.name)}: holding the ${cardName(a).toLowerCase()} and the ${cardName(b).toLowerCase()} makes it${others}.`,
        ...reasons,
        `The next best is ${lower[0]!.hand.name}.`,
      ].join(' '),
    };
  }
}

/** Where you sit, and the starting-hand count a hand needs there to be worth playing. */
export const PREFLOP_SEATS = [
  {
    id: 'heads-up',
    label: 'one opponent, as at the practice table',
    play: 3,
    why: 'With one opponent you play many more hands, but the weakest are still worth folding',
  },
  {
    id: 'early',
    label: 'a full table of nine, one of the first to act',
    play: 10,
    why: 'At a full table most hands are worth folding, and with most players still to act after you, only the strongest are worth playing',
  },
  {
    id: 'middle',
    label: 'a full table of nine, from a middle seat',
    play: 9,
    why: 'At a full table most hands are worth folding: a fold costs nothing more, while a weak hand costs points again and again',
  },
  {
    id: 'late',
    label: 'a full table of nine, one of the last to act',
    play: 7,
    why: 'At a full table most hands are worth folding, but acting near last you see what most others do first, so a few more are worth playing',
  },
] as const;

/** "a pair of nines", "ace and king of one suit". */
function startingWords(hole: Card[]): string {
  const [high, low] = [...hole].sort((x, y) => rankValue(rankOf(y)) - rankValue(rankOf(x))) as [Card, Card];
  if (rankOf(high) === rankOf(low)) return `a pair of ${rankPlural(rankOf(high))}`;
  const suits = suitOf(high) === suitOf(low) ? 'of one suit' : 'of different suits';
  return `${rankName(rankOf(high))} and ${rankName(rankOf(low))} ${suits}`;
}

function preflopItem(random: Random): PokerItem {
  const seat = pick(PREFLOP_SEATS, random);
  // As many hands to play as to fold, and none on the line.
  const wantPlay = random() < 0.5;
  for (;;) {
    const hole = shuffle(deck(), random).slice(0, 2);
    const score = startingScore(hole);
    if (Math.abs(score - seat.play) < 1 || score >= seat.play !== wantPlay) continue;
    return {
      kind: 'preflop',
      prompt: `In poker, before any shared cards come, you hold these two cards, against ${seat.label}. Play the hand (call or raise), or fold it?`,
      cards: { hole },
      options: ['Play', 'Fold'],
      answer: wantPlay ? 0 : 1,
      explanation: `${wantPlay ? 'Play' : 'Fold'}. ${capital(startingWords(hole))} scores ${score} on a simple count of starting hands (after Bill Chen: points for the higher card, doubled for a pair, more for one suit or close ranks, less for a gap). ${seat.why}. Here, play hands that score ${seat.play} or more.`,
    };
  }
}

/** The bands to guess equity in. */
export const EQUITY_BANDS = [
  { label: 'Under 20%', from: 0, to: 20 },
  { label: '20% to 40%', from: 20, to: 40 },
  { label: '40% to 60%', from: 40, to: 60 },
  { label: '60% to 80%', from: 60, to: 80 },
  { label: 'Over 80%', from: 80, to: 100 },
] as const;

/** Deals sampled for equity on the flop: enough to land in the right band, few enough to deal at once. */
const FLOP_SAMPLES = 2000;

function equityItem(random: Random): PokerItem {
  for (;;) {
    const river = random() < 0.5;
    const [a, b, ...rest] = shuffle(deck(), random);
    const hole = [a!, b!];
    const board = rest.slice(0, river ? 5 : 3);
    const { share } = equity(hole, board, { random, samples: FLOP_SAMPLES });
    // Counted exactly on the river; sampled on the flop, so kept further from a band's edge.
    const margin = river ? 1 : 4;
    if (EQUITY_BANDS.some(({ to }) => to < 100 && Math.abs(share - to) < margin)) continue;
    const { name } = evaluate([...hole, ...board]);
    const how = river
      ? `With all five shared cards out, that is worked out over every two cards the other player could hold, ${(45 * 44) / 2} hands, a tie counting as half.`
      : `With two shared cards to come, that is from ${FLOP_SAMPLES.toLocaleString('en')} deals of their two cards and the cards to come, a tie counting as half.`;
    return {
      kind: 'equity',
      prompt: `In poker, your equity is the share of the pot your hand wins on average, a tie counting as half. Against one other player holding any two cards, what is your equity here?`,
      cards: { hole, board },
      options: EQUITY_BANDS.map((band) => band.label),
      answer: EQUITY_BANDS.findIndex(({ to }) => share < to || to === 100),
      explanation: `${river ? '' : 'About '}${percent(share)}. You have ${name}. ${how}`,
    };
  }
}

const MAKERS: Record<PokerDrillKind, (random: Random) => PokerItem> = {
  outs: outsItem,
  'pot-odds': potOddsItem,
  nuts: nutsItem,
  preflop: preflopItem,
  equity: equityItem,
};

/** One exercise of a kind, dealt from the random source. */
export const pokerItem = (kind: PokerDrillKind, random: Random = Math.random): PokerItem => MAKERS[kind](random);

/** Exercises in a round of a drill. */
export const ROUND = 10;

const DAY = 86_400_000;

/**
 * Today's poker exercise: one for each date (YYYY-MM-DD), the same for everyone
 * all day, turning through the drills day by day.
 */
export function pokerDailyItem(date: string): PokerItem {
  const time = Date.parse(`${date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(time) || new Date(time).toISOString().slice(0, 10) !== date)
    throw new Error(`A date as YYYY-MM-DD, not "${date}"`);
  const day = time / DAY;
  const kinds = POKER_DRILL_KINDS.length;
  return pokerItem(POKER_DRILL_KINDS[((day % kinds) + kinds) % kinds]!, seeded(day));
}
