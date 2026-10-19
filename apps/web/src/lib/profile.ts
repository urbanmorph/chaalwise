import { assess, nextFocus, type Assessment } from '@chaalwise/core/profile';
import type { AttemptRecord } from '@chaalwise/core/progress';
import { PROFILE_SKILLS, type ProfileSkill } from './profile-skills';

/** The skill profile from this device's attempts: every skill assessed, and what to work on next. */
export function buildProfile(attempts: Record<string, AttemptRecord[]>): {
  skills: { skill: ProfileSkill; assessment: Assessment }[];
  focus: { skill: ProfileSkill; assessment: Assessment } | undefined;
} {
  const skills = PROFILE_SKILLS.map((skill) => ({ skill, assessment: assess(attempts[skill.id] ?? []) }));
  // Skills that need practice games cannot be worked on yet, so they are never the focus.
  const measurable = skills.filter((s) => !s.skill.later);
  const id = nextFocus(
    Object.fromEntries(measurable.map((s) => [s.skill.id, s.assessment])),
    measurable.map((s) => s.skill.id),
  );
  return { skills, focus: skills.find((s) => s.skill.id === id) };
}
