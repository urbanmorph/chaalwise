import { assess, focusOrder, type Assessment } from '@chaalwise/core/profile';
import type { AttemptRecord } from '@chaalwise/core/progress';
import { PROFILE_SKILLS, type ProfileSkill } from './profile-skills';

type Entry = { skill: ProfileSkill; assessment: Assessment };

/** The skill profile from this device's attempts: every skill assessed, what to work on in order, and the next focus. */
export function buildProfile(attempts: Record<string, AttemptRecord[]>): {
  skills: Entry[];
  ranked: Entry[];
  focus: Entry | undefined;
} {
  const skills = PROFILE_SKILLS.map((skill) => ({ skill, assessment: assess(attempts[skill.id] ?? []) }));
  // Skills that need practice games cannot be worked on yet, so they are never ranked.
  const measurable = skills.filter((s) => !s.skill.later);
  const ranked = focusOrder(
    Object.fromEntries(measurable.map((s) => [s.skill.id, s.assessment])),
    measurable.map((s) => s.skill.id),
  ).map((id) => measurable.find((s) => s.skill.id === id)!);
  return { skills, ranked, focus: ranked[0] };
}
