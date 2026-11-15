import { describe, expect, it } from 'vitest';
import {
  AVERAGE,
  bestPriceAlone,
  screenedGain,
  CHECK,
  checkedGain,
  DAYS,
  drawMarket,
  expectedGain,
  goodShare,
  offersWarranty,
  PARTS,
  PRICES,
  QUALITY,
  SELLERS,
  shop,
  warrantyDay,
  WARRANTY_PRICE,
  willSell,
  type Quality,
} from '../src/lib/labs/scooters';
import { seeded } from '../src/lib/labs/seeded';

describe('used scooters', () => {
  it('runs nine days in three parts: price alone, a mechanic’s check, then warranties', () => {
    expect(PARTS.map((p) => p.id)).toEqual(['price', 'check', 'warranty']);
    expect(DAYS).toBe(9);
    expect(PRICES).toEqual([25, 50, 75, 90]);
  });

  it('a good scooter is worth more to you than to its seller, and so is a poor one: every sale could help both', () => {
    for (const q of ['good', 'poor'] as Quality[]) expect(QUALITY[q].worth).toBeGreaterThan(QUALITY[q].keep);
    expect(AVERAGE).toBe((QUALITY.good.worth + QUALITY.poor.worth) / 2);
    expect(AVERAGE).toBe(80);
  });

  it('sellers sell only when your price beats what the scooter is worth to them', () => {
    expect(willSell('poor', 25)).toBe(true);
    expect(willSell('good', 75)).toBe(false);
    expect(willSell('good', 90)).toBe(true);
  });

  it('at a price near the average, only owners of poor scooters sell, and you lose 45 a time', () => {
    expect(goodShare(75)).toBe(0);
    expect(expectedGain(75)).toBe(-45);
  });

  it('any price that brings out good scooters loses on average: the average is below what good sellers want', () => {
    expect(AVERAGE).toBeLessThan(QUALITY.good.keep);
    for (const price of PRICES) {
      if (goodShare(price) > 0) expect(expectedGain(price), `at ${price}`).toBeLessThan(0);
    }
    expect(goodShare(90)).toBe(0.5);
    expect(expectedGain(90)).toBe(-10);
    // The only price that does not lose buys poor scooters alone.
    const best = Math.max(...PRICES.map(expectedGain));
    expect(best).toBe(5);
    expect(goodShare(PRICES.find((p) => expectedGain(p) === best)!)).toBe(0);
  });

  it('a market of ten sellers, half good on average; you buy from one who will sell at your price', () => {
    const r = seeded(3);
    let good = 0;
    let gain = 0;
    const n = 4000;
    for (let i = 0; i < n; i++) {
      const market = drawMarket(r);
      expect(market).toHaveLength(SELLERS);
      good += market.filter((q) => q === 'good').length / (n * SELLERS);
      const day = shop(market, 90, r);
      if (day.bought) expect(willSell(day.bought, 90)).toBe(true);
      expect(day.came).toBe(market.filter((q) => willSell(q, 90)).length);
      gain += day.gain / n;
      const low = shop(market, 75, r);
      expect(low.bought ?? 'poor').toBe('poor');
    }
    expect(good).toBeCloseTo(0.5, 1);
    // Simulated days match the averages the debrief quotes.
    expect(gain).toBeGreaterThan(-13);
    expect(gain).toBeLessThan(-7);
  });

  it('with no seller at your price, you buy nothing and lose nothing', () => {
    expect(shop(['good', 'good'], 50, seeded(1))).toEqual({ came: 0, gain: 0 });
  });

  it('a mechanic’s check costs 10 but lets you pay a good price for a good scooter: it beats the best price alone', () => {
    expect(CHECK).toBe(10);
    expect(checkedGain('good', 90)).toBe(QUALITY.good.worth - 90 - CHECK);
    expect(checkedGain('good', 75)).toBe(-CHECK);
    expect(checkedGain('poor', 25)).toBe(QUALITY.poor.worth - 25 - CHECK);
    expect(screenedGain()).toBe(12.5);
    expect(bestPriceAlone()).toBe(5);
    expect(screenedGain()).toBeGreaterThan(bestPriceAlone());
    // Simulated: check every scooter, then offer 90 for a good one and 25 for a poor one.
    const r = seeded(17);
    let total = 0;
    for (let i = 0; i < 4000; i++) {
      const q = drawMarket(r)[0]!;
      total += checkedGain(q, q === 'good' ? 90 : 25) / 4000;
    }
    expect(total).toBeGreaterThan(10);
    expect(total).toBeLessThan(15);
  });

  it('a warranty costs the seller of a poor scooter more than it gains, so only good sellers offer one', () => {
    expect(QUALITY.poor.repairs).toBeGreaterThan(WARRANTY_PRICE - QUALITY.poor.keep);
    expect(offersWarranty('good')).toBe(true);
    expect(offersWarranty('poor')).toBe(false);
  });

  it('on a warranty day, two sellers, one good and one poor: the warranty marks the good one; the other is cheap talk', () => {
    const r = seeded(8);
    for (let i = 0; i < 200; i++) {
      const day = warrantyDay(r);
      expect(day.map((s) => s.quality).sort()).toEqual(['good', 'poor']);
      for (const s of day) {
        expect(s.warranty).toBe(s.quality === 'good');
        expect(s.price).toBe(s.warranty ? WARRANTY_PRICE : 50);
        expect(willSell(s.quality, s.price)).toBe(true);
      }
    }
    expect(QUALITY.good.worth - WARRANTY_PRICE).toBe(40);
    expect(QUALITY.poor.worth - 50).toBe(-20);
  });
});
