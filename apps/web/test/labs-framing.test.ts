import { describe, expect, it } from 'vitest';
import { framingRounds, restated, SCENARIOS, shown, tally, type Answer } from '../src/lib/labs/framing';
import { seeded } from '../src/lib/labs/seeded';

describe('gain or loss: the choices', () => {
  it('offers each choice as a sure thing or a gamble that keeps as much on average', () => {
    expect(SCENARIOS.length).toBe(4);
    for (const s of SCENARIOS) expect(s.sure).toBe((s.total * s.chance[0]) / s.chance[1]);
  });

  it('describes the same outcomes in both frames: kept in one, lost in the other', () => {
    const flood = SCENARIOS.find((s) => s.id === 'flood')!;
    expect(shown(flood, 'gain')).toEqual({
      intro: flood.intro,
      sure: '200 homes saved for sure.',
      gamble: 'A 1 in 3 chance that all 600 are saved, and a 2 in 3 chance that none are.',
    });
    expect(shown(flood, 'loss')).toEqual({
      intro: flood.intro,
      sure: '400 homes lost for sure.',
      gamble: 'A 1 in 3 chance that none are lost, and a 2 in 3 chance that all 600 are lost.',
    });
  });

  it('restates each choice in plain outcomes, the same whichever frame it came in', () => {
    const flood = SCENARIOS.find((s) => s.id === 'flood')!;
    expect(restated(flood)).toBe(
      'Plan A ends with 200 homes saved for sure. Plan B ends with all 600 (1 in 3) or none (2 in 3): 200 on average.',
    );
  });
});

describe('gain or loss: the rounds', () => {
  it('asks each choice twice, once as a gain and once as a loss, in two halves', () => {
    const rounds = framingRounds(seeded(1));
    expect(rounds).toHaveLength(8);
    for (const s of SCENARIOS) {
      const frames = rounds.filter((r) => r.scenario.id === s.id).map((r) => r.frame);
      expect(frames.sort()).toEqual(['gain', 'loss']);
    }
    for (const half of [rounds.slice(0, 4), rounds.slice(4)]) {
      expect(new Set(half.map((r) => r.scenario.id)).size).toBe(4);
      expect(half.filter((r) => r.frame === 'gain')).toHaveLength(2);
    }
  });

  it('never asks the same choice twice in a row', () => {
    for (let seed = 0; seed < 200; seed++) {
      const rounds = framingRounds(seeded(seed));
      expect(rounds[3]!.scenario.id).not.toBe(rounds[4]!.scenario.id);
    }
  });

  it('is the same for the same seed, and varies between seeds', () => {
    const ids = (seed: number) => framingRounds(seeded(seed)).map((r) => `${r.scenario.id}:${r.frame}`);
    expect(ids(4)).toEqual(ids(4));
    expect(new Set([1, 2, 3, 4, 5].map((s) => ids(s).join())).size).toBeGreaterThan(1);
  });
});

describe('gain or loss: where the answers flipped', () => {
  const answers = (picks: [string, 'gain' | 'loss', 'sure' | 'gamble'][]): Answer[] =>
    picks.map(([id, frame, pick]) => ({ round: { scenario: SCENARIOS.find((s) => s.id === id)!, frame }, pick }));

  it('pairs the two answers to each choice and finds the ones that changed with the frame', () => {
    const result = tally(
      answers([
        ['flood', 'gain', 'sure'],
        ['flood', 'loss', 'gamble'],
        ['jobs', 'gain', 'sure'],
        ['jobs', 'loss', 'sure'],
        ['points', 'loss', 'sure'],
        ['points', 'gain', 'gamble'],
        ['trees', 'gain', 'gamble'],
        ['trees', 'loss', 'gamble'],
      ]),
    );
    expect(result.rows.map((r) => [r.scenario.id, r.gain, r.loss, r.flipped])).toEqual([
      ['flood', 'sure', 'gamble', true],
      ['jobs', 'sure', 'sure', false],
      ['points', 'gamble', 'sure', true],
      ['trees', 'gamble', 'gamble', false],
    ]);
    expect(result).toMatchObject({ flipped: 2, usual: 1, sureInGain: 2, sureInLoss: 2 });
  });
});
