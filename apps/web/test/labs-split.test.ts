import { describe, expect, it } from 'vitest';
import {
  botTurn,
  dealZone,
  drawRound,
  MAX_OFFERS,
  PIE,
  payout,
  ROUNDS,
  STYLES,
  type Offer,
  type Round,
} from '../src/lib/labs/split';
import { seeded } from '../src/lib/labs/seeded';

const round = (over: Partial<Round> = {}): Round => ({
  you: 30,
  bot: 30,
  style: 'fair',
  opens: 'you',
  ...over,
});

describe('split the pie', () => {
  it('has five rounds over 100 points, at most four offers each', () => {
    expect(ROUNDS).toHaveLength(5);
    expect(PIE).toBe(100);
    expect(MAX_OFFERS).toBe(4);
  });

  it('the deal zone runs from your walk-away to what is left after theirs', () => {
    expect(dealZone(30, 25)).toEqual({ low: 30, high: 75 });
    expect(dealZone(50, 50)).toEqual({ low: 50, high: 50 });
    expect(dealZone(60, 45)).toBeUndefined();
  });

  it('with no deal, each side gets its walk-away points', () => {
    expect(payout(round({ you: 35, bot: 20 }))).toEqual({ you: 35, bot: 20 });
    expect(payout(round({ you: 35, bot: 20 }), 70)).toEqual({ you: 70, bot: 30 });
  });

  it('draws each round from its own ranges, and shows a range for the bot only in some rounds', () => {
    const r = seeded(4);
    for (let n = 0; n < 200; n++) {
      ROUNDS.forEach((spec, i) => {
        const drawn = drawRound(spec, r);
        expect(drawn.you).toBeGreaterThanOrEqual(spec.you[0]);
        expect(drawn.you).toBeLessThanOrEqual(spec.you[1]);
        expect(drawn.bot).toBeGreaterThanOrEqual(spec.bot[0]);
        expect(drawn.bot).toBeLessThanOrEqual(spec.bot[1]);
        if (spec.hint) {
          const [low, high] = drawn.range!;
          expect(low).toBeLessThanOrEqual(drawn.bot);
          expect(high).toBeGreaterThanOrEqual(drawn.bot);
          expect(high - low).toBe(15);
        } else expect(drawn.range, `round ${i + 1}`).toBeUndefined();
      });
    }
    expect(ROUNDS.filter((s) => s.hint).length).toBeGreaterThan(1);
    expect(ROUNDS.filter((s) => !s.hint).length).toBeGreaterThan(0);
  });

  it('includes a round with no deal zone, where walking away is right', () => {
    expect(ROUNDS.filter((spec) => !dealZone(spec.you[0], spec.bot[0]))).toHaveLength(1);
    // Every other round always has a deal zone.
    expect(ROUNDS.filter((spec) => dealZone(spec.you[1], spec.bot[1]))).toHaveLength(4);
  });

  it('the bot opens high for its style and keeps more the tougher it is', () => {
    const open = (style: Round['style']) => {
      const move = botTurn(round({ style, opens: 'bot', bot: 10 }), []);
      return PIE - (move.kind === 'counter' ? move.toYou : 0);
    };
    expect(open('fair')).toBe(STYLES.fair.open);
    expect(open('anchor')).toBeGreaterThan(open('tough'));
    expect(open('tough')).toBeGreaterThan(open('fair'));
  });

  it('a fair bot accepts an even split', () => {
    expect(botTurn(round(), [{ by: 'you', toYou: 50 }])).toEqual({ kind: 'accept' });
  });

  it('meets you part of the way: a high first offer pulls its counter towards you', () => {
    const counter = (ask: number) => {
      const move = botTurn(round({ bot: 10 }), [{ by: 'you', toYou: ask }]);
      return move.kind === 'counter' ? move.toYou : NaN;
    };
    expect(counter(80)).toBeGreaterThan(counter(60));
  });

  it('accepts or rejects your last offer, since no offers are left after it', () => {
    const offers: Offer[] = [
      { by: 'bot', toYou: 20 },
      { by: 'you', toYou: 80 },
      { by: 'bot', toYou: 40 },
    ];
    const r = round({ bot: 40, opens: 'bot', style: 'tough' });
    expect(botTurn(r, [...offers, { by: 'you', toYou: 60 }])).toEqual({ kind: 'accept' });
    expect(botTurn(r, [...offers, { by: 'you', toYou: 61 }])).toEqual({ kind: 'reject' });
  });

  it('never offers or accepts less than its own walk-away, whatever you do', () => {
    const r = seeded(9);
    for (let n = 0; n < 3000; n++) {
      const spec = ROUNDS[n % ROUNDS.length]!;
      const style = (['fair', 'tough', 'anchor'] as const)[n % 3]!;
      const game: Round = { ...drawRound(spec, r), style };
      const offers: Offer[] = [];
      let by: Offer['by'] = game.opens;
      while (offers.length < MAX_OFFERS) {
        if (by === 'you') {
          const ask = Math.floor(r() * (PIE + 1));
          offers.push({ by, toYou: ask });
          const move = botTurn(game, offers);
          if (move.kind === 'accept') expect(PIE - ask).toBeGreaterThanOrEqual(game.bot);
          if (move.kind !== 'counter') break;
          offers.push({ by: 'bot', toYou: move.toYou });
        } else {
          const move = botTurn(game, offers);
          expect(move.kind).toBe('counter');
          if (move.kind === 'counter') offers.push({ by: 'bot', toYou: move.toYou });
        }
        by = 'you';
      }
      for (const o of offers.filter((o) => o.by === 'bot')) expect(PIE - o.toYou).toBeGreaterThanOrEqual(game.bot);
      expect(offers.length).toBeLessThanOrEqual(MAX_OFFERS);
    }
  });
});
