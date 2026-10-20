import { describe, expect, it } from 'vitest';
import { LABS, labsPlayed, playedLabel } from '../src/lib/labs/labs';

describe('which labs have been played on this device', () => {
  const at = new Date('2026-10-20T09:00:00Z');

  it('lists every lab, with when it was last played and how often, from the finished records', () => {
    const played = labsPlayed([
      { lessonId: 'labs/nim', completedAt: at, times: 2 },
      { lessonId: 'chess/fork', completedAt: at, times: 1 },
    ]);
    expect(played.map((l) => l.slug)).toEqual(LABS.map((l) => l.slug));
    expect(played.find((l) => l.slug === 'nim')).toMatchObject({ title: 'Nim', at, times: 2 });
    expect(played.find((l) => l.slug === 'which-bag')).toMatchObject({ at: undefined, times: 0 });
  });

  it('says when, in words that take the same room before and after loading', () => {
    expect(playedLabel(undefined, 0)).toBe('Not yet');
    expect(playedLabel(at, 1)).toBe('20 Oct 2026');
    expect(playedLabel(at, 3)).toBe('20 Oct 2026, 3 times');
  });
});
