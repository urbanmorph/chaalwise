import type { GradedStep, Step } from '@chaalwise/core/lesson';
import { learningPath } from '@chaalwise/core/path';
import { isGraded } from '@chaalwise/core/player';
import type { SkillId } from '@chaalwise/core/skills';
import { getCollection, type CollectionEntry } from 'astro:content';
import { parseMoveText, positionFromMoves, toSan } from './chess';
import { safetyVerdict } from './drills';
import { PLANNED } from './planned-skills';
import { trackOf } from './profile-skills';
import { ask, asStep, corpus } from './questions';

export type LessonEntry = CollectionEntry<'lessons'>;

/** A course of lessons: chess, with the strategy lessons where they fall; poker; or the work cases, on no game's path. */
export type Course = 'chess' | 'poker' | 'case';
export const courseOf = ({ data: { game } }: LessonEntry): Course =>
  game === 'poker' || game === 'case' ? game : 'chess';

/** Where each course's lessons are all listed. */
export const COURSE_HOME: Record<Course, { href: string; label: string }> = {
  chess: { href: '/chess/', label: 'All chess lessons' },
  poker: { href: '/poker/', label: 'All poker lessons' },
  case: { href: '/cases/', label: 'All work cases' },
};

/** A course's lessons in the recommended order (see learningPath): by default chess, with the strategy lessons. */
export async function lessonPath(course: Course = 'chess'): Promise<LessonEntry[]> {
  const all = (await getCollection('lessons')).filter((entry) => courseOf(entry) === course);
  const entries = all.map((entry) => ({
    id: entry.id,
    game: entry.data.game,
    stage: entry.data.stage,
    order: entry.data.order,
    after: entry.data.after,
    entry,
  }));
  return learningPath(entries).map((e) => e.entry);
}

/** Chess lessons only, in curriculum order. */
export async function chessLessons(): Promise<LessonEntry[]> {
  return (await lessonPath()).filter((l) => l.data.game === 'chess');
}

export { lessonHref } from './lesson-href';

/** The lesson after this one on the path, and the earlier-stage lessons it builds on (work cases stand alone, and build on none). */
export async function pathContext(
  lesson: LessonEntry,
): Promise<{ next: LessonEntry | undefined; buildsOn: LessonEntry[] }> {
  const path = await lessonPath(courseOf(lesson));
  const at = path.findIndex((l) => l.id === lesson.id);
  const buildsOn = courseOf(lesson) === 'case' ? [] : path.slice(0, at).filter((l) => l.data.stage < lesson.data.stage);
  return { next: path[at + 1], buildsOn };
}

/** Every lesson, both courses, for looking one up by id. */
export const allLessons = async (): Promise<LessonEntry[]> => [
  ...(await lessonPath('chess')),
  ...(await lessonPath('poker')),
];

export const POKER_STAGES: Record<number, string> = {
  1: 'The hands',
  2: 'Odds',
  3: 'Reading and betting',
  4: 'Keeping your head',
};

/** Work cases by who they are for. */
export const CASE_GROUPS: Record<number, string> = {
  1: 'For students',
  2: 'Starting out at work',
  3: 'Running a team',
  4: 'Running a business',
};

export const STAGES: Record<number, string> = {
  0: 'The board',
  1: "Don't hang pieces",
  2: 'Basic mates',
  3: 'Opening principles',
  4: 'Tactics',
  5: 'Middlegame',
  6: 'Endgames',
  7: 'Full game',
};

/** A lesson's steps as played: its reading and plans, and its questions looked up in the corpus. */
export async function playedSteps(lesson: LessonEntry): Promise<Step[]> {
  return Promise.all(lesson.data.steps.map(async (step) => ('ask' in step ? (await ask([step.ask]))[0]! : step)));
}

/** Every question in the corpus, keyed by its review card, for review and practice. */
export async function reviewSteps(): Promise<Record<string, GradedStep>> {
  return Object.fromEntries([...(await corpus()).values()].map(asStep).map((step) => [step.id, step]));
}

/** Every question that trains a strategy track, keyed by card id: its strategy lessons, and the chess lessons whose skill feeds it. */
export async function trackSteps(track: SkillId): Promise<Record<string, GradedStep>> {
  return Object.fromEntries(Object.entries(await reviewSteps()).filter(([, step]) => trackOf(step.measures) === track));
}

export interface SafetyItem {
  id: string;
  fen: string;
  uci: string;
  san: string;
  safe: boolean;
  text: string;
}

/** The safety drill with its answers worked out by the teaching helpers. */
export async function safetyDrill(): Promise<SafetyItem[]> {
  return (await getCollection('safetyDrills')).map(({ id, data }) => {
    const fen = data.fen ?? positionFromMoves(data.moves!);
    const uci = parseMoveText(fen, data.move)!;
    return { id, fen, uci, san: toSan(fen, uci), ...safetyVerdict(fen, uci, data.note) };
  });
}

/** A track's strategy lessons in curriculum order: each built one with its lesson, each planned one with its stage. */
export async function trackLessons(track: SkillId): Promise<{ title: string; stage: number; lesson?: LessonEntry }[]> {
  const built = (await lessonPath()).filter((l) => l.data.game === 'strategy');
  return PLANNED.filter((p) => p.skill === track).map((p) => ({
    ...p,
    lesson: built.find((l) => l.data.title === p.title),
  }));
}

/** The poker lessons, or the work cases, that train a track. */
export async function lessonsFor(course: 'poker' | 'case', track: SkillId): Promise<LessonEntry[]> {
  return (await lessonPath(course)).filter((l) => l.data.skills.includes(track));
}

/** The chess lessons whose answers count towards a track. */
export async function chessLessonsFor(track: SkillId): Promise<LessonEntry[]> {
  const chess = (await lessonPath()).filter((l) => l.data.game === 'chess');
  const steps = await Promise.all(chess.map(playedSteps));
  return chess.filter((_, i) => steps[i]!.some((step) => isGraded(step) && trackOf(step.measures) === track));
}
