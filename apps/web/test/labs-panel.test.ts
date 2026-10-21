import { describe, expect, it } from 'vitest';
import { average, BOX, DOTS, drawRounds, offBy, PANEL, panelGuesses, typical } from '../src/lib/labs/panel';
import { seeded } from '../src/lib/labs/seeded';

describe('ask the panel: the rounds', () => {
  it('plays six boxes of dots, three guessed alone and three after hearing a first voice', () => {
    const rounds = drawRounds(seeded(1));
    expect(rounds).toHaveLength(6);
    expect(rounds.filter((r) => r.heard)).toHaveLength(3);
    for (const r of rounds) {
      expect(r.dots).toBeGreaterThanOrEqual(DOTS[0]);
      expect(r.dots).toBeLessThanOrEqual(DOTS[1]);
      expect(r.guesses).toHaveLength(PANEL);
    }
  });

  it('draws as many dots as it says, inside the box and apart, so they can be told apart', () => {
    for (const r of drawRounds(seeded(2))) {
      expect(r.points).toHaveLength(r.dots);
      for (const [x, y] of r.points) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(BOX.width);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(BOX.height);
      }
      const [a, b] = [r.points[0]!, r.points[1]!];
      expect(Math.hypot(a[0] - b[0], a[1] - b[1])).toBeGreaterThan(BOX.gap - 0.01);
    }
  });

  it('is the same for the same seed', () => {
    expect(drawRounds(seeded(3))).toEqual(drawRounds(seeded(3)));
  });
});

describe('ask the panel: the guesses', () => {
  it('has each bot guess on its own, wrong by a different amount each time', () => {
    const guesses = panelGuesses(300, false, seeded(4));
    expect(new Set(guesses).size).toBeGreaterThan(4);
    for (const g of guesses) expect(offBy(g, 300)).toBeLessThan(1.5);
  });

  it('after hearing the first voice, each bot moves halfway (on a ratio scale) from its own guess towards it', () => {
    const alone = panelGuesses(300, false, seeded(5));
    const heard = panelGuesses(300, true, seeded(5));
    expect(heard[0]).toBe(alone[0]);
    for (let i = 1; i < PANEL; i++) expect(heard[i]).toBe(Math.round(Math.sqrt(alone[0]! * alone[i]!)));
  });

  it('averages and measures how far off a guess is', () => {
    expect(average([100, 200, 301])).toBe(200);
    expect(offBy(330, 300)).toBeCloseTo(0.1);
    expect(offBy(270, 300)).toBeCloseTo(0.1);
  });

  it('over many replays, the average of independent guesses beats one bot, and beats a panel that heard the first voice', () => {
    const t = typical(4000, seeded(6));
    expect(t.alone).toBeLessThan(t.one / 2);
    expect(t.heard).toBeGreaterThan(t.alone * 1.4);
    expect(t.heard).toBeLessThan(t.one);
  });
});
