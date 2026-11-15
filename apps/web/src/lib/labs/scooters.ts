import { shuffle, type Random } from './seeded';

/**
 * Used scooters: the market for lemons (Akerlof, 1970). Sellers know whether
 * their scooter is good or poor; you see only the price. Half are good, so an
 * average scooter is worth less to you than a good seller will take, and any
 * price that brings good sellers out loses you points: they leave, and poor
 * scooters are all that sell. Then two ways out: screening, a mechanic's
 * check you pay for, and signalling (Spence, 1973), a warranty that only the
 * seller of a good scooter can afford to give. The numbers are this lab's design.
 */

export type Quality = 'good' | 'poor';

/** What a scooter is worth to you, the least its seller takes, and the repairs a 3-month warranty would cost its seller. */
export const QUALITY: Record<Quality, { name: string; worth: number; keep: number; repairs: number }> = {
  good: { name: 'good', worth: 130, keep: 85, repairs: 3 },
  poor: { name: 'poor', worth: 30, keep: 20, repairs: 80 },
};

/** What an average scooter is worth to you: half are good. */
export const AVERAGE = (QUALITY.good.worth + QUALITY.poor.worth) / 2;

/** The prices you can offer. */
export const PRICES = [25, 50, 75, 90];

/** A mechanic's check, which tells you a scooter's quality. */
export const CHECK = 10;

/** Sellers at the market each day. */
export const SELLERS = 10;

/** The price a seller asks with a warranty, and without one. */
export const WARRANTY_PRICE = 90;
export const PLAIN_PRICE = 50;

export type PartId = 'price' | 'check' | 'warranty';

export const PARTS: { id: PartId; name: string; days: number }[] = [
  { id: 'price', name: 'Price alone', days: 3 },
  { id: 'check', name: 'A mechanic’s check', days: 3 },
  { id: 'warranty', name: 'Warranties', days: 3 },
];

export const DAYS = PARTS.reduce((s, p) => s + p.days, 0);

/** The sellers' first names, for the story. */
export const NAMES = ['Anil', 'Farida', 'Gopal', 'Kavya', 'Lata', 'Manoj', 'Nisha', 'Priya', 'Salim', 'Vikram'];

export const willSell = (q: Quality, price: number) => price >= QUALITY[q].keep;

const qualities: Quality[] = ['good', 'poor'];
const gain = (q: Quality, price: number) => QUALITY[q].worth - price;

/** The share of the scooters on sale at a price that are good. */
export const goodShare = (price: number) => {
  const selling = qualities.filter((q) => willSell(q, price));
  return selling.length ? selling.filter((q) => q === 'good').length / selling.length : 0;
};

/** Your average gain from a scooter bought at a price, when you cannot tell good from poor. */
export const expectedGain = (price: number) => {
  const selling = qualities.filter((q) => willSell(q, price));
  return selling.length ? selling.reduce((s, q) => s + gain(q, price), 0) / selling.length : 0;
};

/** A day's sellers: each scooter good or poor, evenly. */
export const drawMarket = (random: Random): Quality[] =>
  Array.from({ length: SELLERS }, () => (random() < 0.5 ? 'good' : 'poor'));

/** A day at the market: how many sellers will sell at your price, and the scooter you buy from one of them, if any. */
export function shop(
  market: readonly Quality[],
  price: number,
  random: Random,
): { came: number; bought?: Quality; gain: number; seller?: number } {
  const willing = market.flatMap((q, i) => (willSell(q, price) ? [i] : []));
  if (!willing.length) return { came: 0, gain: 0 };
  const seller = willing[Math.floor(random() * willing.length)]!;
  const bought = market[seller]!;
  return { came: willing.length, bought, gain: gain(bought, price), seller };
}

/** Your gain from a checked scooter offered a price: its worth less the price and the check, or the check alone if the seller says no. */
export const checkedGain = (q: Quality, price: number) => (willSell(q, price) ? gain(q, price) : 0) - CHECK;

/** The most you gain on average with no way to tell quality: the best of the prices. */
export const bestPriceAlone = () => Math.max(...PRICES.map(expectedGain));

/** Your average gain with a check every time, then the best choice for what it shows: a price, or walking away. */
export const screenedGain = () =>
  qualities.reduce((s, q) => s + Math.max(-CHECK, ...PRICES.map((p) => checkedGain(q, p))), 0) / qualities.length;

/** Whether a seller gains by giving a warranty at the warranty price, after the repairs it will pay for. */
export const offersWarranty = (q: Quality) => WARRANTY_PRICE - QUALITY[q].repairs >= QUALITY[q].keep;

export interface Stall {
  quality: Quality;
  warranty: boolean;
  price: number;
}

/** A warranty day: one good and one poor scooter, in either order; each seller gives a warranty only if it pays. */
export const warrantyDay = (random: Random): Stall[] =>
  shuffle(qualities, random).map((quality) => {
    const warranty = offersWarranty(quality);
    return { quality, warranty, price: warranty ? WARRANTY_PRICE : PLAIN_PRICE };
  });
