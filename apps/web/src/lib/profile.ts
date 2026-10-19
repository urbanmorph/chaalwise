import { assess, focusOrder, type Assessment } from '@chaalwise/core/profile';
import type { AttemptRecord } from '@chaalwise/core/progress';
import { CHESS_SKILLS, PROFILE_SKILLS, type ChessSkill, type ProfileSkill } from './profile-skills';

type Entry<S = ProfileSkill> = { skill: S; assessment: Assessment };
type Attempts = Record<string, AttemptRecord[]>;

/** Each strategy track's evidence: the strategy lessons' own answers, and the answers of the game skills that train it. */
export function trackAttempts(attempts: Attempts): Attempts {
  return Object.fromEntries(
    PROFILE_SKILLS.map(({ id }) => [
      id,
      [...(attempts[id] ?? []), ...CHESS_SKILLS.filter((s) => s.track === id).flatMap((s) => attempts[s.id] ?? [])],
    ]),
  );
}

const assessAll = <S extends { id: string }>(skills: S[], attempts: Attempts): Entry<S>[] =>
  skills.map((skill) => ({ skill, assessment: assess(attempts[skill.id] ?? []) }));

/**
 * The skill profile from this device's attempts: every strategy track assessed,
 * what to work on in order, the next focus, and chess proficiency on its own.
 */
export function buildProfile(attempts: Attempts): {
  skills: Entry[];
  ranked: Entry[];
  focus: Entry | undefined;
  games: Entry<ChessSkill>[];
} {
  const skills = assessAll(PROFILE_SKILLS, trackAttempts(attempts));
  // A track nothing measures yet cannot be worked on here, so it is never ranked.
  const measurable = skills.filter((s) => !s.skill.later);
  const ranked = focusOrder(
    Object.fromEntries(measurable.map((s) => [s.skill.id, s.assessment])),
    measurable.map((s) => s.skill.id),
  ).map((id) => measurable.find((s) => s.skill.id === id)!);
  return { skills, ranked, focus: ranked[0], games: assessAll(CHESS_SKILLS, attempts) };
}
