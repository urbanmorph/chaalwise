import { describe, expect, it } from 'vitest';
import {
  AHEAD,
  BOTH_WRONG,
  countTips,
  debriefSimulation,
  drawStreet,
  FRIENDS,
  lockedOn,
  other,
  readQueue,
  ROUNDS,
  runStreet,
  simulate,
  STREET,
  tally,
  TIP_RIGHT,
  walk,
  type Door,
} from '../src/lib/labs/cascade';
import { seeded } from '../src/lib/labs/seeded';

describe('follow the queue: a street', () => {
  it('has twelve people, you sixth, each with a tip that is right 2 times in 3, and four friends’ tips for you to ask', () => {
    expect([STREET, AHEAD, FRIENDS, TIP_RIGHT]).toEqual([12, 5, 4, 2 / 3]);
    const r = seeded(1);
    let right = 0;
    for (let i = 0; i < 3000; i++) {
      const s = drawStreet(r);
      expect(s.tips).toHaveLength(STREET);
      expect(s.friends).toHaveLength(FRIENDS);
      right += [...s.tips, ...s.friends].filter((t) => t === s.better).length / (3000 * (STREET + FRIENDS));
    }
    expect(right).toBeCloseTo(2 / 3, 1);
  });

  it('a street picked to start wrong: the first two tips wrong and yours right, which a fair draw gives 1 time in 9 for the first two', () => {
    const r = seeded(2);
    for (let i = 0; i < 200; i++) {
      const s = drawStreet(r, true);
      expect(s.rigged).toBe(true);
      expect(s.tips.slice(0, 2)).toEqual([other(s.better), other(s.better)]);
      expect(s.tips[AHEAD]).toBe(s.better);
    }
    expect(BOTH_WRONG).toBeCloseTo(1 / 9);
  });

  it('plays six streets: three reading the queue, then three where you may ask why and ask four friends; one of each picked to start wrong', () => {
    expect(ROUNDS.map((r) => [r.part, r.rigged])).toEqual([
      ['queue', false],
      ['queue', true],
      ['queue', false],
      ['ask', false],
      ['ask', true],
      ['ask', false],
    ]);
  });
});

describe('follow the queue: reading the queue', () => {
  it('follows your own tip until one door leads by two tips, then follows the queue whatever your tip says', () => {
    expect(readQueue(0, 'green')).toBe('green');
    expect(readQueue(1, 'green')).toBe('green');
    expect(readQueue(-1, 'blue')).toBe('blue');
    expect(readQueue(2, 'green')).toBe('blue');
    expect(readQueue(-2, 'blue')).toBe('green');
    expect(lockedOn(1)).toBeUndefined();
    expect(lockedOn(-2)).toBe('green');
  });

  it('a cascade: after two choices the same way, everyone follows, and their choices show nothing of their tips', () => {
    const tips: Door[] = ['blue', 'blue', 'green', 'green', 'green', 'green'];
    const { people, lead } = walk(tips);
    expect(people.map((p) => p.choice)).toEqual(['blue', 'blue', 'blue', 'blue', 'blue', 'blue']);
    expect(people.map((p) => p.showed)).toEqual([true, true, false, false, false, false]);
    expect(lead).toBe(2);
  });

  it('mixed early tips cancel and the count starts again', () => {
    const { people, lead } = walk(['blue', 'green', 'green', 'blue', 'green', 'green']);
    expect(people.map((p) => p.choice)).toEqual(['blue', 'green', 'green', 'blue', 'green', 'green']);
    expect(lead).toBe(-2);
  });

  it('runs a whole street with your choice: those behind read it like anyone’s, and the street ends where its last person goes', () => {
    const street = {
      better: 'green' as Door,
      tips: [
        'blue',
        'blue',
        'green',
        'green',
        'green',
        'green',
        'green',
        'green',
        'green',
        'green',
        'green',
        'green',
      ] as Door[],
      friends: ['green', 'green'] as Door[],
      rigged: true,
    };
    const run = runStreet(street, 'green');
    expect(run.people).toHaveLength(STREET);
    expect(run.people[AHEAD]).toMatchObject({ you: true, choice: 'green', showed: false });
    expect(run.lockedAt).toBe(2);
    expect(run.door).toBe('blue');
    expect(run.ended).toBe('blue');
    expect(run.people.slice(AHEAD + 1).every((p) => p.choice === 'blue')).toBe(true);
    // Before the lock, your choice counts as a tip for those behind you.
    const open = runStreet(
      {
        ...street,
        tips: ['blue', 'green', 'blue', 'green', 'blue', 'green', 'green', 'green', 'green', 'green', 'green', 'green'],
      },
      'green',
    );
    expect(open.lockedAt).toBe(8);
    expect(open.ended).toBe('green');
  });

  it('counting tips: those the queue showed, then yours and your friends’; a tie goes to your own tip', () => {
    expect(countTips(2, 'green', ['green', 'green'])).toBe('green');
    expect(countTips(2, 'green', ['green', 'blue'])).toBe('blue');
    expect(countTips(1, 'green', [])).toBe('green');
    expect(countTips(0, 'blue', ['green', 'green'])).toBe('green');
  });
});

describe('follow the queue: what the debrief says', () => {
  const sim = simulate(20000, seeded(7));

  it('a street that reads the queue ends on the wrong door about 1 time in 5', () => {
    expect(sim.ended).toBeGreaterThan(0.17);
    expect(sim.ended).toBeLessThan(0.23);
  });

  it('that is better than one tip alone (1 in 3 wrong) but worse than pooling all twelve tips', () => {
    expect(sim.oneTip).toBeCloseTo(1 / 3, 1);
    expect(sim.pooled).toBeLessThan(sim.ended - 0.05);
    expect(sim.pooled).toBeGreaterThan(0.09);
    expect(sim.pooled).toBeLessThan(0.15);
  });

  it('by the time you arrive, sixth, the queue has usually locked on a door', () => {
    expect(sim.lockedBefore).toBeGreaterThan(0.6);
    expect(sim.lockedWrong).toBeGreaterThan(0.13);
    expect(sim.lockedWrong).toBeLessThan(0.25);
  });

  it('asking why and asking four friends gets you the better door more often than reading the queue', () => {
    expect(sim.youAsk).toBeLessThan(sim.youRead - 0.05);
  });

  it('the simulation the debrief shows bears out the same', () => {
    const shown = debriefSimulation();
    expect(Math.round(shown.ended * 100)).toBe(20);
    expect(shown.pooled).toBeLessThan(shown.ended);
    expect(shown.ended).toBeLessThan(shown.oneTip);
    expect(shown.youAsk).toBeLessThan(shown.youRead - 0.05);
    expect(shown.lockedBefore).toBeGreaterThan(0.75);
  });

  it('tallies your streets: tips that pointed to the better door against the people who chose it', () => {
    const r = seeded(9);
    const runs = ROUNDS.map((round) => {
      const street = drawStreet(r, round.rigged);
      return { street, run: runStreet(street, street.tips[AHEAD]!) };
    });
    const t = tally(runs);
    const others = runs.flatMap(({ street, run }) =>
      run.people.filter((p) => !p.you).map((p) => [p, street.better] as const),
    );
    expect(t.people).toBe(66);
    expect(t.tipsRight).toBe(others.filter(([p, better]) => p.tip === better).length);
    expect(t.choseRight).toBe(others.filter(([p, better]) => p.choice === better).length);
    const early = runs.filter(({ run }) => run.lockedAt !== undefined && run.lockedAt <= AHEAD);
    expect(t.locked).toBe(early.length);
    expect(t.lockedWrong).toBe(early.filter(({ street, run }) => run.door !== street.better).length);
    // The street picked to start wrong is locked on the wrong door before you arrive.
    expect(t.lockedWrong).toBeGreaterThanOrEqual(2);
  });
});
