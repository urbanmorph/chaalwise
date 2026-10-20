import { assess, focusOrder, type Assessment } from '@chaalwise/core/profile';
import type { AttemptRecord } from '@chaalwise/core/progress';
import { CHESS_SKILLS, PROFILE_SKILLS, type ChessSkill, type ProfileSkill } from './profile-skills';

type Entry<S = ProfileSkill> = { skill: S; assessment: Assessment };
type Attempts = Record<string, AttemptRecord[]>;

/** Each track's answers on the board: the game skills that train it. */
const boardAttempts = (attempts: Attempts): Attempts =>
  Object.fromEntries(
    PROFILE_SKILLS.map(({ id }) => [
      id,
      CHESS_SKILLS.filter((s) => s.track === id).flatMap((s) => attempts[s.id] ?? []),
    ]),
  );

/** Everything that trains each track, off the board and on it, for the activity chart. */
export function trackAttempts(attempts: Attempts): Attempts {
  const board = boardAttempts(attempts);
  return Object.fromEntries(PROFILE_SKILLS.map(({ id }) => [id, [...(attempts[id] ?? []), ...board[id]!]]));
}

const assessAll = <S extends { id: string }>(skills: S[], attempts: Attempts): Entry<S>[] =>
  skills.map((skill) => ({ skill, assessment: assess(attempts[skill.id] ?? []) }));

/**
 * The skill profile from this device's attempts: every strategy track assessed
 * from answers off the board, what to work on in order, the next focus, and
 * apart from those, each track's answers on the board and chess proficiency.
 * Being good at a game is not evidence of the skill elsewhere, so the two are
 * never mixed in a level.
 */
export function buildProfile(attempts: Attempts): {
  skills: Entry[];
  onBoard: Record<string, Assessment>;
  ranked: Entry[];
  focus: Entry | undefined;
  games: Entry<ChessSkill>[];
} {
  const skills = assessAll(PROFILE_SKILLS, attempts);
  const board = boardAttempts(attempts);
  const onBoard = Object.fromEntries(PROFILE_SKILLS.map(({ id }) => [id, assess(board[id]!)]));
  // A track nothing measures yet cannot be worked on here, so it is never ranked.
  const measurable = skills.filter((s) => !s.skill.later);
  const ranked = focusOrder(
    Object.fromEntries(measurable.map((s) => [s.skill.id, s.assessment])),
    measurable.map((s) => s.skill.id),
  ).map((id) => measurable.find((s) => s.skill.id === id)!);
  return { skills, onBoard, ranked, focus: ranked[0], games: assessAll(CHESS_SKILLS, attempts) };
}
