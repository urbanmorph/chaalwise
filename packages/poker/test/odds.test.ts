import { describe, expect, it } from 'vitest';
import type { Card } from '../src/cards';
import { equity, exactChance, outs, ruleOf } from '../src/odds';
import { seeded } from '../src/random';

const c = (text: string) => text.split(' ') as Card[];

describe('outs', () => {
  it('counts nine outs for a flush draw', () => {
    const o = outs(c('Ah Kh'), c('Qh 7h 2c'));
    expect(o.drawing).toBe('flush');
    expect(o.count).toBe(9);
    expect(o.cards.every((card) => card.endsWith('h'))).toBe(true);
  });

  it('counts eight outs for an open-ended straight draw', () => {
    const o = outs(c('9s 8d'), c('7c 6h 2s'));
    expect(o.drawing).toBe('straight');
    expect(o.count).toBe(8);
    expect(o.cards.every((card) => card[0] === 'T' || card[0] === '5')).toBe(true);
  });

  it('counts four outs for an inside straight draw, on the turn too', () => {
    const o = outs(c('9s 8d'), c('6c 5h 2s Kd'));
    expect(o.drawing).toBe('straight');
    expect(o.count).toBe(4);
  });

  it('counts fifteen outs for a flush and straight draw together', () => {
    const o = outs(c('9h 8h'), c('7h 6h 2c'));
    expect(o.drawing).toBe('flush or straight');
    expect(o.count).toBe(15);
  });

  it('counts six outs for two overcards to make a pair', () => {
    const o = outs(c('As Kd'), c('7c 5h 2s'));
    expect(o.drawing).toBe('pair or better');
    expect(o.count).toBe(6);
  });

  it('counts two outs for a pocket pair to make three of a kind', () => {
    expect(outs(c('8s 8d'), c('Kc 5h 2s')).count).toBe(2);
  });

  it('does not count cards that only make a straight on the board', () => {
    const o = outs(c('As Kd'), c('8c 7h 6s 5d'));
    expect(o.cards.some((card) => card[0] === '4' || card[0] === '9')).toBe(false);
  });

  it('only works on the flop and the turn', () => {
    expect(() => outs(c('As Kd'), [])).toThrow();
    expect(() => outs(c('As Kd'), c('8c 7h 6s 5d 2c'))).toThrow();
  });
});

describe('chances', () => {
  it('uses the rule of 2 and 4', () => {
    expect(ruleOf(9, 2)).toBe(36);
    expect(ruleOf(9, 1)).toBe(18);
  });

  it('works out the exact chance', () => {
    expect(exactChance(9, 47, 2)).toBeCloseTo(34.97, 2);
    expect(exactChance(9, 46, 1)).toBeCloseTo(19.57, 2);
    expect(exactChance(0, 47, 2)).toBe(0);
  });
});

describe('equity: the share of the pot a hand wins on average', () => {
  it('works it out exactly when little is unknown: a pair of aces against a pair of kings with a card to come', () => {
    // On the turn the kings win only with one of the two kings left: 2 of 44 cards.
    const e = equity(c('As Ad'), c('7c 4h 2s 9d'), { against: c('Kh Kc') });
    expect(e.exact).toBe(true);
    expect(e.share).toBeCloseTo((42 / 44) * 100, 5);
  });

  it('splits a tie: both play the straight on the board', () => {
    expect(equity(c('2c 3d'), c('Ac Kc Qd Js Th'), { against: c('4h 5s') }).share).toBe(50);
  });

  it('counts against any two cards when the other hand is unknown, exactly on the river', () => {
    const e = equity(c('As Ks'), c('Ah Kd 7c 4s 2h'));
    expect(e.exact).toBe(true);
    expect(e.share).toBeGreaterThan(95);
  });

  it('estimates by sampling when too much is unknown, the same each time for the same seed', () => {
    const a = equity(c('Ah Ad'), [], { random: seeded(1), samples: 4000 });
    const b = equity(c('Ah Ad'), [], { random: seeded(1), samples: 4000 });
    expect(a.exact).toBe(false);
    expect(a.share).toBe(b.share);
    // Aces against one random hand win about 85% of the time.
    expect(a.share).toBeGreaterThan(82);
    expect(a.share).toBeLessThan(88);
  });

  it('counts every winning card, not only the draw: nine hearts and three aces against a pair of kings', () => {
    const e = equity(c('Ah 5h'), c('Kh 9h 2c 7s'), { against: c('Ks Qd') });
    expect(e.share).toBeCloseTo((12 / 44) * 100, 5);
  });
});
