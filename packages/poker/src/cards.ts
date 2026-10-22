import type { Random } from './random';

export type Suit = 's' | 'h' | 'd' | 'c';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';
/** A card as rank then suit, e.g. "As" for the ace of spades, "Th" for the ten of hearts. */
export type Card = `${Rank}${Suit}`;

/** Ranks from lowest to highest. */
export const RANKS: readonly Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
export const SUITS: readonly Suit[] = ['s', 'h', 'd', 'c'];

const RANK_NAMES: Record<Rank, string> = {
  '2': 'two',
  '3': 'three',
  '4': 'four',
  '5': 'five',
  '6': 'six',
  '7': 'seven',
  '8': 'eight',
  '9': 'nine',
  T: 'ten',
  J: 'jack',
  Q: 'queen',
  K: 'king',
  A: 'ace',
};

const SUIT_NAMES: Record<Suit, string> = { s: 'spades', h: 'hearts', d: 'diamonds', c: 'clubs' };

export const rankOf = (card: Card): Rank => card[0] as Rank;
export const suitOf = (card: Card): Suit => card[1] as Suit;

/** A rank's value, two = 2 up to ace = 14. */
export const rankValue = (rank: Rank): number => RANKS.indexOf(rank) + 2;

/** The full deck, suit by suit, two up to ace. Always the same order. */
export const deck = (): Card[] => SUITS.flatMap((suit) => RANKS.map((rank): Card => `${rank}${suit}`));

/** A shuffled copy of the cards (Fisher–Yates); the cards passed in are left alone. */
export function shuffle(cards: readonly Card[], random: Random): Card[] {
  const out = [...cards];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** "jack", "ace". */
export const rankName = (rank: Rank): string => RANK_NAMES[rank];

/** "jacks", "sixes", "aces". */
export const rankPlural = (rank: Rank): string => (rank === '6' ? 'sixes' : `${RANK_NAMES[rank]}s`);

/** "spades", "hearts". */
export const suitName = (suit: Suit): string => SUIT_NAMES[suit];

/** "Ace of spades", "Ten of hearts". */
export function cardName(card: Card): string {
  const name = rankName(rankOf(card));
  return `${name[0]!.toUpperCase()}${name.slice(1)} of ${suitName(suitOf(card))}`;
}
