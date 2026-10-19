import { describe, expect, it } from 'vitest';
import { buildProfile } from '../src/lib/profile';
import { PROFILE_SKILLS } from '../src/lib/profile-skills';

const at = (day: number) => new Date(Date.UTC(2026, 9, day, 9));
const tries = (skill: string, outcomes: ('first-try' | 'missed')[], day = 1) =>
  outcomes.map((outcome) => ({ skill, outcome, at: at(day), source: 'lesson' as const }));

describe('the skill profile on this device', () => {
  it('assesses every profile skill, started or not', () => {
    const { skills } = buildProfile({});
    expect(skills.map((s) => s.skill.id)).toEqual(PROFILE_SKILLS.map((s) => s.id));
    expect(skills.every((s) => s.assessment.level === 'not-started')).toBe(true);
  });

  it('starts a new learner on board sense', () => {
    expect(buildProfile({}).focus?.skill.id).toBe('board');
  });

  it('focuses on the weakest skill started', () => {
    const { focus } = buildProfile({
      board: tries('board', Array(12).fill('first-try'), 1).concat(tries('board', ['first-try'], 2)),
      safety: tries('safety', ['first-try', 'missed', 'missed']),
    });
    expect(focus?.skill.id).toBe('safety');
  });

  it('never makes a skill that needs practice games the focus', () => {
    const solid = (skill: string) => [
      ...tries(skill, Array(12).fill('first-try'), 1),
      ...tries(skill, ['first-try'], 2),
    ];
    const all = Object.fromEntries(PROFILE_SKILLS.filter((s) => !s.later).map((s) => [s.id, solid(s.id)]));
    expect(['planning', 'time']).not.toContain(buildProfile(all).focus?.skill.id);
  });
});
