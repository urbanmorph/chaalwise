import { describe, expect, it } from 'vitest';
import {
  botHunt,
  CROWD,
  crowdPicks,
  defectRound,
  drawMeets,
  expectedMatches,
  focal,
  HUNTERS,
  HUNTS,
  huntPoints,
  MEETS,
  playHunt,
  tally,
  type HuntRound,
  type Signal,
} from '../src/lib/labs/coordination';
import { seeded } from '../src/lib/labs/seeded';

describe('pick the same: meeting without a word', () => {
  it('has four meet-ups, each with options, and how the bots lean when matching and when picking a favourite', () => {
    expect(MEETS).toHaveLength(4);
    for (const m of MEETS) {
      expect(m.options.length).toBeGreaterThan(1);
      expect(m.match).toHaveLength(m.options.length);
      expect(m.like).toHaveLength(m.options.length);
      expect(m.match.reduce((s, x) => s + x, 0)).toBeCloseTo(1);
      expect(m.like.reduce((s, x) => s + x, 0)).toBeCloseTo(1);
    }
  });

  it('starts with heads or tails, where bots trying to match say heads about as often as Schelling’s 36 of 42', () => {
    const coin = MEETS[0]!;
    expect(coin.options).toEqual(['Heads', 'Tails']);
    expect(coin.match[0]).toBeCloseTo(36 / 42, 1);
  });

  it('has one answer that stands out in each: bots trying to match crowd onto it far more than onto their own favourites', () => {
    for (const m of MEETS) {
      const f = focal(m);
      expect(Math.max(...m.match.filter((_, i) => i !== f))).toBeLessThan(m.match[f]! / 2);
      // Asked what they like best, the bots spread out: no option gets as many as the focal one gets when matching.
      expect(Math.max(...m.like)).toBeLessThan(m.match[f]! - 0.25);
    }
  });

  it('has at least one meet-up where the favourite is not what stands out', () => {
    expect(MEETS.some((m) => m.like.indexOf(Math.max(...m.like)) !== focal(m))).toBe(true);
  });

  it('draws a crowd of ten bots for each meet-up, the same for the same seed', () => {
    const a = drawMeets(seeded(1));
    expect(a).toHaveLength(MEETS.length);
    for (const [i, d] of a.entries()) {
      expect(d.match).toHaveLength(CROWD);
      expect(d.like).toHaveLength(CROWD);
      for (const c of [...d.match, ...d.like]) expect(c).toBeLessThan(MEETS[i]!.options.length);
    }
    expect(drawMeets(seeded(1))).toEqual(a);
  });

  it('over many crowds, the bots trying to match pick the focal answer about as often as its weight', () => {
    const coin = MEETS[0]!;
    const r = seeded(2);
    const picks = Array.from({ length: 500 }, () => crowdPicks(coin.match, r)).flat();
    expect(picks.filter((p) => p === 0).length / picks.length).toBeCloseTo(coin.match[0]!, 1);
  });

  it('counts how many picked each option, and expects the focal pick to match the most bots', () => {
    expect(tally([0, 2, 2, 1, 2], 3)).toEqual([1, 1, 3]);
    for (const m of MEETS) {
      const best = expectedMatches(m, focal(m));
      for (let i = 0; i < m.options.length; i++) expect(expectedMatches(m, i)).toBeLessThanOrEqual(best);
    }
    expect(expectedMatches(MEETS[0]!, 0)).toBeCloseTo(CROWD * MEETS[0]!.match[0]!);
  });
});

describe('pick the same: the stag hunt', () => {
  const play = (moves: [Signal, 'stag' | 'hare'][], defectAt = 6): HuntRound[] => {
    const history: HuntRound[] = [];
    for (const [signal, you] of moves) history.push(playHunt(history, signal, you, defectAt));
    return history;
  };
  const total = (h: HuntRound[]) => h.reduce((s, r) => s + huntPoints(r.you, r.caught), 0);
  const all = (signal: Signal, you: 'stag' | 'hare') =>
    Array.from({ length: HUNTS }, () => [signal, you] as [Signal, 'stag' | 'hare']);

  it('pays 6 for a stag caught by all five, 3 for a hare whatever happens, and nothing for a stag hunt that failed', () => {
    expect(huntPoints('stag', true)).toBe(6);
    expect(huntPoints('hare', true)).toBe(3);
    expect(huntPoints('hare', false)).toBe(3);
    expect(huntPoints('stag', false)).toBe(0);
  });

  it('has four bot hunters, each with a name and a style, and eight hunts', () => {
    expect(HUNTERS.map((h) => h.id)).toEqual(['ana', 'ben', 'chen', 'dev']);
    for (const h of HUNTERS) expect(h.name && h.style).toBeTruthy();
    expect(HUNTS).toBe(8);
  });

  it('catches the stag only when all five hunt it', () => {
    const [r] = play([['first', 'stag']]);
    expect(r!.caught).toBe(true);
    const [s] = play([['first', 'stag']], 1);
    expect(s!.bots.dev).toBe('hare');
    expect(s!.caught).toBe(false);
  });

  it('with no word, the hunter who was burned before plays safe, so the stag is lost', () => {
    const [r] = play([['none', 'stag']]);
    expect(r!.bots.chen).toBe('hare');
    expect(r!.caught).toBe(false);
    expect(total(play(all('none', 'stag')))).toBe(0);
  });

  it('words reach the trusting hunters, but not the one who was burned', () => {
    const [r] = play([['word', 'stag']]);
    expect(r!.bots).toEqual({ ana: 'stag', ben: 'stag', chen: 'hare', dev: 'stag' });
  });

  it('setting out first, where all can see, is a signal everyone believes', () => {
    const [r] = play([['first', 'stag']]);
    expect(Object.values(r!.bots).every((m) => m === 'stag')).toBe(true);
  });

  it('after two stags in a row, the track record is enough: they hunt the stag without a signal', () => {
    const h = play([
      ['first', 'stag'],
      ['first', 'stag'],
      ['none', 'stag'],
    ]);
    expect(h[2]!.caught).toBe(true);
  });

  it('one defector sinks the hunt for all, and after it the record has to be rebuilt', () => {
    const h = play(
      [
        ['first', 'stag'],
        ['first', 'stag'],
        ['none', 'stag'],
        ['none', 'stag'],
        ['none', 'stag'],
      ],
      4,
    );
    expect(h[3]!.bots.dev).toBe('hare');
    expect(h[3]!.caught).toBe(false);
    // Ana was burned and Chen's record is gone: without a signal, they play safe.
    expect(h[4]!.bots.ana).toBe('hare');
    expect(h[4]!.bots.chen).toBe('hare');
    expect(h[4]!.caught).toBe(false);
  });

  it('a broken word is remembered: once you say stag and hunt hare, words stop working on the hunter who trusted them', () => {
    const h = play([
      ['word', 'hare'],
      ['word', 'stag'],
    ]);
    expect(h[0]!.bots.ben).toBe('stag');
    expect(h[1]!.bots.ben).toBe('hare');
    expect(botHunt('ben', h.slice(0, 1), 'first', 2, 6)).toBe('stag');
  });

  it('always going first earns most: every stag but the defector’s round, against 24 for always hare', () => {
    expect(total(play(all('none', 'hare')))).toBe(24);
    expect(total(play(all('first', 'stag')))).toBe(7 * 6);
  });

  it('the defector’s round is round 5, 6 or 7, the same for the same seed', () => {
    const r = seeded(3);
    const rounds = new Set(Array.from({ length: 300 }, () => defectRound(r)));
    expect([...rounds].sort()).toEqual([5, 6, 7]);
    expect(defectRound(seeded(4))).toBe(defectRound(seeded(4)));
  });
});
