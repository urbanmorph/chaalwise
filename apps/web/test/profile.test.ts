import { SKILL_IDS } from '@chaalwise/core/skills';
import { describe, expect, it } from 'vitest';
import { buildProfile, trackAttempts } from '../src/lib/profile';
import { LABS } from '../src/lib/labs/labs';
import { readdirSync, readFileSync } from 'node:fs';
import { GAME_SKILLS, LESSON_TRACKS, POKER_SKILLS, PROFILE_SKILLS, trackOf } from '../src/lib/profile-skills';

const at = (day: number) => new Date(Date.UTC(2026, 9, day, 9));
const tries = (skill: string, outcomes: ('first-try' | 'missed')[], day = 1) =>
  outcomes.map((outcome) => ({ skill, outcome, at: at(day), source: 'lesson' as const }));
const solid = (skill: string) => [...tries(skill, Array(12).fill('first-try'), 1), ...tries(skill, ['first-try'], 2)];

describe('the skill profile on this device', () => {
  it('assesses every strategy track, started or not', () => {
    const { skills } = buildProfile({});
    expect(skills.map((s) => s.skill.id)).toEqual(PROFILE_SKILLS.map((s) => s.id));
    expect(new Set(skills.map((s) => s.skill.id))).toEqual(new Set(SKILL_IDS));
    expect(skills.every((s) => s.assessment.level === 'not-started')).toBe(true);
  });

  it('starts a new learner on thinking ahead, the skill the first strategy lesson trains', () => {
    expect(buildProfile({}).focus?.skill.id).toBe('think-ahead');
  });

  it('keeps a track level to answers off the board, and shows chess answers beside it as on the board', () => {
    const { skills, onBoard } = buildProfile({
      safety: solid('safety'),
      'think-ahead': tries('think-ahead', ['first-try']),
    });
    const ahead = skills.find((s) => s.skill.id === 'think-ahead')!;
    // Winning hanging pieces is chess skill; it is not evidence of thinking ahead at work.
    expect(ahead.assessment).toMatchObject({ level: 'noticing', total: 1 });
    expect(onBoard['think-ahead']?.level).toBe('reliable');
  });

  it('still adds chess answers to the track for the activity chart, with the strategy lessons own answers', () => {
    const merged = trackAttempts({
      safety: tries('safety', ['first-try', 'missed']),
      anticipation: tries('anticipation', ['first-try']),
      'think-ahead': tries('think-ahead', ['first-try']),
      board: tries('board', ['first-try']),
    });
    expect(merged['think-ahead']).toHaveLength(4);
    // Board sense is learning the game, not a strategy skill.
    expect(
      Object.values(merged)
        .flat()
        .filter((a) => a.skill === 'board'),
    ).toHaveLength(0);
  });

  it('focuses on the weakest track started off the board', () => {
    const { focus } = buildProfile({
      'think-ahead': solid('think-ahead'),
      calculate: tries('calculate', ['first-try', 'missed', 'missed']),
    });
    expect(focus?.skill.id).toBe('calculate');
  });

  it('never makes a track that cannot be measured yet the focus, and leaves it out of the ranking', () => {
    const all = Object.fromEntries(PROFILE_SKILLS.map((s) => [s.id, solid(s.id)]));
    const { focus, ranked } = buildProfile(all);
    expect(PROFILE_SKILLS.find((s) => s.id === focus?.skill.id)?.later).toBeUndefined();
    expect(ranked.map((s) => s.skill.id)).toEqual(PROFILE_SKILLS.filter((s) => !s.later).map((s) => s.id));
  });

  it('measures cooperating, being unpredictable and valuing things through the labs', () => {
    for (const id of ['cooperate', 'unpredictable', 'value'])
      expect(PROFILE_SKILLS.find((s) => s.id === id)?.later, id).toBeUndefined();
  });

  it('measures every track now: weighing odds, risk, hidden information and bluffing through poker', () => {
    expect(PROFILE_SKILLS.filter((s) => s.later)).toEqual([]);
    for (const id of ['weigh-odds', 'size-risk', 'read-hidden', 'bluff'])
      expect(
        POKER_SKILLS.some((s) => s.track === id),
        id,
      ).toBe(true);
  });

  it('counts poker answers as game evidence for the track they train, like chess', () => {
    expect(trackOf('odds')).toBe('weigh-odds');
    const { skills, onBoard } = buildProfile({ odds: solid('odds') });
    expect(skills.find((s) => s.skill.id === 'weigh-odds')!.assessment.level).toBe('not-started');
    expect(onBoard['weigh-odds']?.level).toBe('reliable');
  });

  it('keeps every game skill as proficiency, board sense and reading poker hands included', () => {
    const { games } = buildProfile({ board: tries('board', ['first-try']) });
    expect(games.map((g) => g.skill.id)).toEqual(GAME_SKILLS.map((s) => s.id));
    expect(games.find((g) => g.skill.id === 'board')?.assessment.level).toBe('noticing');
  });

  it('knows which tracks the built strategy lessons train, matching the lessons themselves', () => {
    const dir = new URL('../src/content/lessons/strategy/', import.meta.url);
    const trained = readdirSync(dir).map(
      (f) => readFileSync(new URL(f, dir), 'utf8').match(/^skills: \[([a-z-]+)/m)![1],
    );
    expect(new Set(LESSON_TRACKS)).toEqual(new Set(trained));
  });

  it('measures every track that a game skill, a lab or a strategy lesson gives evidence for, and only those', () => {
    const fed = new Set([
      ...GAME_SKILLS.map((s) => s.track).filter(Boolean),
      ...LABS.map((l) => l.track),
      ...LESSON_TRACKS,
    ]);
    expect(new Set(PROFILE_SKILLS.filter((s) => !s.later).map((s) => s.id))).toEqual(fed);
  });
});
