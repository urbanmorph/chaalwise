import { between, type Random } from './seeded';

/** The points to split in every negotiation. */
export const PIE = 100;
/** Offers in a round, both sides counted; after the last one there is a deal or none. */
export const MAX_OFFERS = 4;

export type Side = 'you' | 'bot';
export type Style = 'fair' | 'tough' | 'anchor';

/**
 * How each bot bargains: the share it opens by keeping, how far it moves
 * towards your last offer each time (0 to 1), and the share it is happy to
 * accept straight away.
 */
export const STYLES: Record<Style, { name: string; about: string; open: number; meet: number; content: number }> = {
  fair: {
    name: 'Fair bot',
    about: 'Opens near an even split and meets you halfway.',
    open: 55,
    meet: 0.5,
    content: 50,
  },
  tough: { name: 'Tough bot', about: 'Opens high and gives ground slowly.', open: 75, meet: 0.25, content: 70 },
  anchor: { name: 'Anchoring bot', about: 'Opens very high, then concedes quickly.', open: 90, meet: 0.6, content: 60 },
};

/** A round as planned: the bot, who opens, the ranges the walk-away points come from, and whether you get a hint of the bot's. */
export interface RoundSpec {
  style: Style;
  opens: Side;
  you: [number, number];
  bot: [number, number];
  hint: boolean;
}

export const ROUNDS: RoundSpec[] = [
  { style: 'fair', opens: 'you', you: [20, 35], bot: [20, 35], hint: false },
  { style: 'anchor', opens: 'bot', you: [15, 30], bot: [25, 40], hint: true },
  { style: 'tough', opens: 'you', you: [25, 40], bot: [15, 30], hint: true },
  { style: 'fair', opens: 'bot', you: [56, 62], bot: [45, 50], hint: true },
  { style: 'anchor', opens: 'you', you: [40, 50], bot: [15, 30], hint: false },
];

/** A round as played: each side's walk-away points, and the rough range you are shown for the bot's. */
export interface Round {
  you: number;
  bot: number;
  style: Style;
  opens: Side;
  range?: [number, number];
}

export interface Offer {
  by: Side;
  /** Points to you; the bot gets the rest of the pie. */
  toYou: number;
}

export type BotMove = { kind: 'accept' } | { kind: 'reject' } | { kind: 'counter'; toYou: number };

/** The width of the range you are shown for the bot's walk-away. */
const HINT = 15;

export function drawRound(spec: RoundSpec, random: Random): Round {
  const you = between(spec.you[0], spec.you[1], random);
  const bot = between(spec.bot[0], spec.bot[1], random);
  const round: Round = { you, bot, style: spec.style, opens: spec.opens };
  if (spec.hint) {
    const low = bot - between(0, HINT, random);
    round.range = [low, low + HINT];
  }
  return round;
}

/** The deals both sides prefer to no deal, as points to you; none when the walk-away points add up to more than the pie. */
export function dealZone(you: number, bot: number): { low: number; high: number } | undefined {
  return you + bot <= PIE ? { low: you, high: PIE - bot } : undefined;
}

/** What each side ends with: the deal's split, or each side's walk-away points. */
export const payout = (round: Pick<Round, 'you' | 'bot'>, toYou?: number) =>
  toYou === undefined ? { you: round.you, bot: round.bot } : { you: toYou, bot: PIE - toYou };

/**
 * The bot's move, given the offers so far: open, accept your last offer,
 * counter by meeting you part of the way, or, when no offers are left, reject.
 * It never offers or accepts less than its own walk-away points.
 */
export function botTurn(round: Round, offers: readonly Offer[]): BotMove {
  const style = STYLES[round.style];
  const floor = round.bot;
  const lastBot = offers.findLast((o) => o.by === 'bot');
  const asked = lastBot ? PIE - lastBot.toYou : Math.max(floor, style.open);
  const yours = offers.at(-1);
  if (!yours) return { kind: 'counter', toYou: PIE - asked };
  const toBot = PIE - yours.toYou;
  if (offers.length >= MAX_OFFERS) return { kind: toBot >= floor ? 'accept' : 'reject' };
  if (toBot >= Math.max(floor, Math.min(asked, style.content))) return { kind: 'accept' };
  const keep = Math.max(floor, Math.round(asked - style.meet * (asked - toBot)));
  return { kind: 'counter', toYou: PIE - keep };
}
