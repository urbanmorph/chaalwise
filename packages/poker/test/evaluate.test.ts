import { describe, expect, it } from 'vitest';
import type { Card } from '../src/cards';
import { compare, evaluate } from '../src/evaluate';

/** Cards from a space-separated string, e.g. "As Kd 7c". */
const c = (text: string) => text.split(' ') as Card[];
const ev = (text: string) => evaluate(c(text));
const sorted = (cards: Card[]) => [...cards].sort();

describe('evaluate: categories and names', () => {
  it('high card', () => {
    const v = ev('As Jd 9c 6h 3s');
    expect(v.category).toBe('high-card');
    expect(v.name).toBe('ace high');
  });

  it('a pair', () => {
    const v = ev('Ks Kd 9c 6h 3s');
    expect(v.category).toBe('pair');
    expect(v.name).toBe('a pair of kings');
  });

  it('two pair', () => {
    const v = ev('As Ad 8c 8h 3s');
    expect(v.category).toBe('two-pair');
    expect(v.name).toBe('two pair, aces and eights');
  });

  it('three of a kind', () => {
    const v = ev('7s 7d 7c Kh 3s');
    expect(v.category).toBe('three-of-a-kind');
    expect(v.name).toBe('three of a kind, sevens');
  });

  it('a straight, and an ace-high straight', () => {
    expect(ev('6s 5d 4c 3h 2s').name).toBe('a straight, six high');
    const broadway = ev('As Kd Qc Jh Ts');
    expect(broadway.category).toBe('straight');
    expect(broadway.name).toBe('a straight, ace high');
  });

  it('the wheel is a five-high straight, the lowest straight', () => {
    const wheel = ev('As 2d 3c 4h 5s');
    expect(wheel.category).toBe('straight');
    expect(wheel.name).toBe('a straight, five high');
    expect(compare(wheel, ev('6s 5d 4c 3h 2s'))).toBeLessThan(0);
    expect(compare(wheel, ev('As Ad Kc Qh Js'))).toBeGreaterThan(0);
  });

  it('a flush', () => {
    const v = ev('Ah Jh 9h 6h 3h');
    expect(v.category).toBe('flush');
    expect(v.name).toBe('a flush, ace high');
  });

  it('a full house', () => {
    const v = ev('Qs Qd Qc 4h 4s');
    expect(v.category).toBe('full-house');
    expect(v.name).toBe('a full house, queens full of fours');
  });

  it('four of a kind', () => {
    const v = ev('9s 9d 9c 9h 3s');
    expect(v.category).toBe('four-of-a-kind');
    expect(v.name).toBe('four of a kind, nines');
  });

  it('a straight flush and a royal flush', () => {
    expect(ev('9h 8h 7h 6h 5h').name).toBe('a straight flush, nine high');
    expect(ev('5d 4d 3d 2d Ad').name).toBe('a straight flush, five high');
    expect(ev('Ah Kh Qh Jh Th').name).toBe('a royal flush');
    expect(ev('Ah Kh Qh Jh Th').category).toBe('straight-flush');
  });
});

describe('evaluate: ordering', () => {
  it('ranks every category above the one below', () => {
    const ladder = [
      'As Jd 9c 6h 3s',
      '2s 2d 9c 6h 3s',
      '3s 3d 2c 2h 4s',
      '2s 2d 2c 4h 5s',
      'As 2d 3c 4h 5s',
      '7h 5h 4h 3h 2h',
      '2s 2d 2c 3h 3s',
      '2s 2d 2c 2h 3s',
      '5d 4d 3d 2d Ad',
    ].map(ev);
    for (let i = 1; i < ladder.length; i++) expect(compare(ladder[i]!, ladder[i - 1]!)).toBeGreaterThan(0);
  });

  it('a flush beats a straight in seven cards holding both', () => {
    const v = ev('9h 8h 7c 6h 5h 2h Kd');
    expect(v.category).toBe('flush');
    expect(v.name).toBe('a flush, nine high');
  });

  it('decides a pair by its kickers', () => {
    expect(compare(ev('Ks Kd Ac 6h 3s'), ev('Kh Kc Qc 6d 3d'))).toBeGreaterThan(0);
    expect(compare(ev('Ks Kd Ac 6h 3s'), ev('Kh Kc Ad 6d 2d'))).toBeGreaterThan(0);
  });

  it('decides two pair by the fifth card', () => {
    expect(compare(ev('As Ad 8c 8h Ks'), ev('Ah Ac 8s 8d Qs'))).toBeGreaterThan(0);
  });

  it('decides high card all the way down', () => {
    expect(compare(ev('As Jd 9c 6h 3s'), ev('Ad Jc 9h 6s 2s'))).toBeGreaterThan(0);
  });

  it('calls equal hands a tie, for a split pot', () => {
    const board = 'As Kd Qc Jh Ts';
    expect(compare(ev(`${board} 2c 3d`), ev(`${board} 4c 5d`))).toBe(0);
    expect(compare(ev('Ah Kh 8c 8d 3s'), ev('Ac Kd 8h 8s 3d'))).toBe(0);
  });
});

describe('evaluate: best five of seven', () => {
  it('finds the best five and returns them', () => {
    const v = ev('Ks Kd 2c 7h 9s Jd 4c');
    expect(v.category).toBe('pair');
    expect(sorted(v.best)).toEqual(sorted(c('Ks Kd Jd 9s 7h')));
  });

  it('makes a full house from two sets of three', () => {
    const v = ev('Qs Qd Qc 4h 4s 4d 2c');
    expect(v.category).toBe('full-house');
    expect(v.name).toBe('a full house, queens full of fours');
    expect(v.best).toHaveLength(5);
    expect(v.best.filter((card) => card[0] === 'Q')).toHaveLength(3);
    expect(v.best.filter((card) => card[0] === '4')).toHaveLength(2);
  });

  it('keeps the best kicker with two pair from three pairs', () => {
    const v = ev('As Ad 8c 8h 5s 5d Kc');
    expect(v.name).toBe('two pair, aces and eights');
    expect(sorted(v.best)).toEqual(sorted(c('As Ad 8c 8h Kc')));
  });

  it('takes the highest straight from six in a row', () => {
    const v = ev('9h 8c 7d 6s 5h 4c 2d');
    expect(v.name).toBe('a straight, nine high');
    expect(sorted(v.best)).toEqual(sorted(c('9h 8c 7d 6s 5h')));
  });

  it('takes the five highest of six suited cards', () => {
    const v = ev('Ah Jh 9h 6h 3h 2h Kd');
    expect(sorted(v.best)).toEqual(sorted(c('Ah Jh 9h 6h 3h')));
  });

  it('rejects fewer than five or more than seven cards', () => {
    expect(() => ev('As Kd Qc Jh')).toThrow();
    expect(() => ev('As Kd Qc Jh Ts 9s 8s 7s')).toThrow();
  });
});
