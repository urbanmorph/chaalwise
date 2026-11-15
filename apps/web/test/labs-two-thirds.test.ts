import { describe, expect, it } from 'vitest';
import {
  BOTS,
  botGuess,
  chain,
  CROWDS,
  DEPTHS,
  depthOf,
  drawCrowd,
  play,
  debriefReplays,
  replay,
  simulate,
  stepGuess,
  summarise,
} from '../src/lib/labs/two-thirds';
import { seeded } from '../src/lib/labs/seeded';

describe('guess two-thirds: the thinkers', () => {
  it('level 0 guesses at random, averaging 50; each step takes two-thirds of the step before; all the way is 0', () => {
    expect(stepGuess(0)).toBe(50);
    expect(stepGuess(1)).toBeCloseTo(33.33, 2);
    expect(stepGuess(2)).toBeCloseTo(22.22, 2);
    expect(stepGuess(3)).toBeCloseTo(14.81, 2);
    expect(stepGuess(Infinity)).toBe(0);
    const r = seeded(1);
    const zeros = Array.from({ length: 4000 }, () => botGuess(0, r));
    expect(Math.min(...zeros)).toBe(0);
    expect(Math.max(...zeros)).toBe(100);
    expect(zeros.reduce((s, g) => s + g, 0) / zeros.length).toBeCloseTo(50, 0);
  });

  it('a bot that thinks k steps guesses within 3 of its step’s number, as a whole number', () => {
    const r = seeded(2);
    for (const k of [1, 2, 3, 4]) {
      for (let i = 0; i < 200; i++) {
        const g = botGuess(k, r);
        expect(Number.isInteger(g)).toBe(true);
        expect(Math.abs(g - stepGuess(k))).toBeLessThanOrEqual(3.5);
      }
    }
    expect(botGuess(Infinity, r)).toBe(0);
  });

  it('names how many steps a guess is nearest to, with 0 as all the way', () => {
    expect(depthOf(50)).toBe(0);
    expect(depthOf(80)).toBe(0);
    expect(depthOf(33)).toBe(1);
    expect(depthOf(22)).toBe(2);
    expect(depthOf(15)).toBe(3);
    expect(depthOf(0)).toBe(Infinity);
    expect(DEPTHS).toEqual([0, 1, 2, 3, Infinity]);
  });

  it('the "rational" chain: no one should guess above 67, so none above 44, and so on, down to 0', () => {
    expect(chain(5).map(Math.round)).toEqual([100, 67, 44, 30, 20, 13]);
  });
});

describe('guess two-thirds: the crowds and a round', () => {
  it('plays four crowds of eleven bots, each mix shallower or deeper', () => {
    expect(CROWDS.map((c) => c.id)).toEqual(['fest', 'again', 'readers', 'class']);
    for (const c of CROWDS) {
      expect(
        c.mix.reduce((s, [, n]) => s + n, 0),
        c.id,
      ).toBe(BOTS);
      expect(drawCrowd(c, seeded(3))).toHaveLength(BOTS);
    }
    // The second time, everyone in the fest crowd thinks one step further.
    const [fest, again] = CROWDS;
    expect(again!.mix.map(([k, n]) => [k - 1, n])).toEqual(fest!.mix);
  });

  it('the winner is the guess closest to two-thirds of the average, yours counted in', () => {
    const round = play([10, 20, 30, 40], 60);
    expect(round.average).toBe(32);
    expect(round.target).toBeCloseTo(21.33, 2);
    expect(round.winning).toEqual([20]);
    expect(round.youWon).toBe(false);
    expect(round.yourDistance).toBeCloseTo(38.67, 2);
    expect(round.rank).toBe(5);
    const won = play([10, 30, 40, 60], 20);
    expect(won.youWon).toBe(true);
    expect(won.rank).toBe(1);
  });

  it('a tie for closest is shared: both win', () => {
    const round = play([20, 40], 30);
    expect(round.target).toBe(20);
    expect(round.winning).toEqual([20]);
    const tie = play([18, 22, 50, 70], 0);
    expect(tie.target).toBeCloseTo(21.33, 2);
    expect(play([20, 22, 50, 70], 22).youWon).toBe(true);
  });

  it('replays a round with another guess in place of yours: how far it would have been, and whether it would have won', () => {
    const bots = [40, 40, 40];
    expect(replay(bots, 0)).toEqual({ distance: 20, won: true });
    expect(replay(bots, 50).won).toBe(false);
  });
});

describe('guess two-thirds: what the debrief says', () => {
  const sim = simulate(2000, seeded(11));
  const best = (id: string) => sim.find((s) => s.crowd === id)!.best;
  const at = (id: string, depth: number) => sim.find((s) => s.crowd === id)!.distance[DEPTHS.indexOf(depth)]!;

  it('first-timers: one or two steps beats both none (50) and all the way (0)', () => {
    for (const id of ['fest', 'readers']) {
      expect([1, 2], id).toContain(best(id));
      expect(Math.min(at(id, 1), at(id, 2)), id).toBeLessThan(at(id, 0));
      expect(Math.min(at(id, 1), at(id, 2)), id).toBeLessThan(at(id, Infinity));
    }
  });

  it('a crowd that has played once thinks a step further, and so should you', () => {
    expect(best('again')).toBe(best('fest') + 1);
  });

  it('a crowd that knows the theory wins with a deeper guess, yet 0 still loses: some of them stop short', () => {
    expect(best('class')).toBeGreaterThanOrEqual(3);
    expect(Number.isFinite(best('class'))).toBe(true);
    expect(at('class', Infinity)).toBeGreaterThan(at('class', best('class')));
  });

  it('over all four crowds, two steps beats both none and all the way, and neither extreme is ever the best guess', () => {
    const mean = (d: number) => sim.reduce((s, c) => s + c.distance[DEPTHS.indexOf(d)]!, 0) / sim.length;
    expect(mean(2)).toBeLessThan(mean(0) / 3);
    expect(mean(2)).toBeLessThan(mean(Infinity) / 2);
    for (const c of sim) expect([0, Infinity], c.crowd).not.toContain(c.best);
  });

  it('the replays the debrief shows bear out the same', () => {
    const shown = debriefReplays();
    const bestOf = (id: string) => shown.find((s) => s.crowd === id)!.best;
    expect(bestOf('fest')).toBe(2);
    expect(bestOf('readers')).toBe(2);
    expect(bestOf('again')).toBe(3);
    expect(bestOf('class')).toBe(3);
    for (const s of shown) {
      expect(s.distance[DEPTHS.indexOf(s.best)]).toBeLessThan(s.distance[0]!);
      expect(s.distance[DEPTHS.indexOf(s.best)]).toBeLessThan(s.distance[DEPTHS.indexOf(Infinity)]!);
    }
  });

  it('the best depth for a target is the step nearest to it', () => {
    expect(depthOf(23.8)).toBe(2);
    expect(depthOf(9)).toBe(3);
    expect(depthOf(1)).toBe(Infinity);
  });

  it('sums up the learner’s rounds: how far each depth would have been, on average, and which was closest', () => {
    const rounds = CROWDS.map((c, i) => ({ bots: drawCrowd(c, seeded(20 + i)).map((b) => b.guess), you: 33 }));
    const s = summarise(rounds);
    expect(s.distance).toHaveLength(DEPTHS.length);
    for (const [i, d] of DEPTHS.entries()) {
      const each = rounds.map((r) => replay(r.bots, Math.round(stepGuess(d))).distance);
      expect(s.distance[i]).toBeCloseTo(each.reduce((a, b) => a + b, 0) / each.length, 6);
    }
    expect(s.best).toBe(DEPTHS[s.distance.indexOf(Math.min(...s.distance))]);
  });
});
