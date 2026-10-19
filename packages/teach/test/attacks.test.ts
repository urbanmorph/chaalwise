import { describe, expect, it } from 'vitest';
import { attackers, defenders } from '../src/attacks';
import { pos, sq } from './helpers';

describe('attackers and defenders', () => {
  const p = pos('4k3/2n5/8/3p4/8/4N3/8/3RK3 w - - 0 1');

  it('lists the attackers of a square, cheapest first', () => {
    expect(attackers(p, sq('d5'), 'white').map((a) => a.name)).toEqual(['e3', 'd1']);
  });

  it("lists a piece's defenders: its own side's attackers of its square", () => {
    expect(defenders(p, sq('d5')).map((a) => a.name)).toEqual(['c7']);
  });

  it('gives nothing for an empty square', () => {
    expect(defenders(p, sq('a4'))).toEqual([]);
  });

  it('does not count a piece hidden behind another (that is an x-ray)', () => {
    const battery = pos('4k3/8/8/3p4/8/8/3R4/3QK3 w - - 0 1');
    expect(attackers(battery, sq('d5'), 'white').map((a) => a.name)).toEqual(['d2']);
  });
});
