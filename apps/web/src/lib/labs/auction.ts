import { between, type Random } from './seeded';

/** The learner and four bots. */
export const BIDDERS = 5;
/** Every estimate is within this many points of the true value. */
export const SPREAD = 30;
/** The jar is worth somewhere from LOW to HIGH points. */
export const LOW = 40;
export const HIGH = 160;
/** The bots bid a little under their estimate: not enough, as the lab shows. */
export const BOT_SHADE = 5;

export interface Item {
  /** What the jar is really worth, the same for every bidder; revealed after the bids. */
  value: number;
  /** Each bidder's estimate: the value plus an error of up to SPREAD either way. The learner's is first. */
  estimates: number[];
}

/** A jar of coins and every bidder's estimate of it. */
export function drawItem(random: Random, bidders = BIDDERS): Item {
  const value = between(LOW, HIGH, random);
  return { value, estimates: Array.from({ length: bidders }, () => value + between(-SPREAD, SPREAD, random)) };
}

export const botBid = (estimate: number): number => Math.max(0, estimate - BOT_SHADE);

/** The highest bid wins (the first, if level) and pays what it bid. */
export function settle(value: number, bids: readonly number[]): { winner: number; profit: number } {
  const winner = bids.indexOf(Math.max(...bids));
  return { winner, profit: value - bids[winner]! };
}

/**
 * How far the highest of n estimates is above the value, on average, when
 * errors are spread evenly up to `spread` either way: shading your bid by this
 * much makes winning break even.
 */
export const breakEvenShade = (bidders: number, spread = SPREAD): number => (spread * (bidders - 1)) / (bidders + 1);

/** Many auctions in which every bidder bids its estimate minus `shade`. */
export function simulateAuctions(bidders: number, shade: number, trials: number, random: Random) {
  let profit = 0;
  let mostOptimistic = 0;
  for (let i = 0; i < trials; i++) {
    const { value, estimates } = drawItem(random, bidders);
    const result = settle(
      value,
      estimates.map((e) => e - shade),
    );
    profit += result.profit;
    if (estimates[result.winner] === Math.max(...estimates)) mostOptimistic++;
  }
  return { winnerProfit: profit / trials, winnerWasMostOptimistic: mostOptimistic / trials };
}
