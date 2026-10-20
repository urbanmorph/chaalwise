import { describe, expect, it } from 'vitest';
import type { Card } from '../src/cards';
import { exactChance, outs, ruleOf } from '../src/odds';

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
