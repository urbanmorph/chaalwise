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
import { LABS } from './labs/labs';

export type LessonEntry = CollectionEntry<'lessons'>;

/**
 * A course of lessons: chess or poker, each with the strategy lessons that follow its lessons; the strategy
 * lessons that follow a lab; or the work cases, on no game's path. A strategy lesson is on the course of what it
 * follows (one that follows another strategy lesson is on the chess path).
 */
export type Course = 'chess' | 'poker' | 'labs' | 'case';
export const courseOf = ({ data: { game, after } }: LessonEntry): Course =>
  game === 'poker' || game === 'case'
    ? game
    : after?.startsWith('poker/')
      ? 'poker'
      : after?.startsWith('labs/')
        ? 'labs'
        : 'chess';

/** Where each course's lessons are all listed. */
export const COURSE_HOME: Record<Course, { href: string; label: string; done: string }> = {
  chess: { href: '/chess/', label: 'All chess lessons', done: 'Lesson complete' },
  poker: { href: '/poker/', label: 'All poker lessons', done: 'Lesson complete' },
  labs: { href: '/labs/', label: 'All labs', done: 'Lesson complete' },
  case: { href: '/cases/', label: 'All work cases', done: 'Case complete' },
};

/** What a lesson may follow off the path: each lab, in the order the labs page lists them. */
const LAB_ANCHORS = LABS.map((lab) => `labs/${lab.slug}`);

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
  return learningPath(entries, course === 'labs' ? LAB_ANCHORS : []).map((e) => e.entry);
}

/** Every strategy lesson, on whichever path it falls: after chess lessons, poker lessons or labs. */
export async function strategyLessons(): Promise<LessonEntry[]> {
  const paths = await Promise.all((['chess', 'poker', 'labs'] as const).map((course) => lessonPath(course)));
  return paths.flat().filter((l) => l.data.game === 'strategy');
}

/** Chess lessons only, in curriculum order. */
export async function chessLessons(): Promise<LessonEntry[]> {
  return (await lessonPath()).filter((l) => l.data.game === 'chess');
}

export { lessonHref } from './lesson-href';

/**
 * The lesson after this one on the path, and the earlier-stage lessons it builds on. Work cases stand alone and
 * build on none; a lesson after a lab builds on the lab, and the next lab's lesson does not follow from it.
 */
export async function pathContext(
  lesson: LessonEntry,
): Promise<{ next: LessonEntry | undefined; buildsOn: LessonEntry[] }> {
  const course = courseOf(lesson);
  if (course === 'labs') return { next: undefined, buildsOn: [] };
  const path = await lessonPath(course);
  const at = path.findIndex((l) => l.id === lesson.id);
  const buildsOn = course === 'case' ? [] : path.slice(0, at).filter((l) => l.data.stage < lesson.data.stage);
  return { next: path[at + 1], buildsOn };
}

/** Every lesson on a game's path, and those after labs, for looking one up by id. */
export const allLessons = async (): Promise<LessonEntry[]> => [
  ...(await lessonPath('chess')),
  ...(await lessonPath('poker')),
  ...(await lessonPath('labs')),
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

/** The chess stage where the path goes deeper: stages 0 to 3 are enough to play a real game; the rest is for after your first games. */
export const GOING_DEEPER = 4;

export const STAGES: Record<number, string> = {
  0: 'The board',
  1: 'Keep your pieces safe',
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

/**
 * Every question in the corpus, keyed by its review card, for review and practice. The decisions of the cases a
 * week later are left out: they must be new when their case comes (see later-cases.ts).
 */
export async function reviewSteps(): Promise<Record<string, GradedStep>> {
  return Object.fromEntries(
    [...(await corpus()).values()]
      .filter((q) => !q.id.startsWith('later/'))
      .map(asStep)
      .map((step) => [step.id, step]),
  );
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

/**
 * Where a strategy lesson starts, as the strategy page labels it: the lab or poker lesson it follows, by name (looked
 * up in `poker`), or its chess stage. The name comes last, so any title reads well, such as "After a lab: Which bag?".
 */
export function startsFrom({ data: { after, stage } }: LessonEntry, poker: readonly LessonEntry[] = []): string {
  const lab = LABS.find((l) => after === `labs/${l.slug}`);
  if (lab) return `After a lab: ${lab.title}`;
  if (!after?.startsWith('poker/')) return `Chess · stage ${stage}`;
  const lesson = poker.find((l) => l.id === after);
  return lesson ? `After a poker lesson: ${lesson.data.title}` : 'After a poker lesson';
}

/**
 * A track's strategy lessons: the planned ones in curriculum order, each built one with its lesson, then the built
 * ones the plan did not list (such as those after poker lessons and labs), in path order.
 */
export async function trackLessons(track: SkillId): Promise<{ title: string; stage: number; lesson?: LessonEntry }[]> {
  const built = (await strategyLessons()).filter((l) => l.data.skills.includes(track));
  const planned = PLANNED.filter((p) => p.skill === track).map((p) => ({
    ...p,
    lesson: built.find((l) => l.data.title === p.title),
  }));
  const unplanned = built
    .filter((l) => !planned.some((p) => p.lesson === l))
    .map((lesson) => ({ title: lesson.data.title, stage: lesson.data.stage, lesson }));
  return [...planned, ...unplanned];
}

/** The strategy and poker lessons that train a track, and those that follow a lab: what a lab page offers next. */
export async function labLessons(lab: { slug: string; track: SkillId }): Promise<LessonEntry[]> {
  const after = (l: LessonEntry) => l.data.after === `labs/${lab.slug}`;
  const strategy = await strategyLessons();
  return [
    ...strategy.filter(after),
    ...strategy.filter((l) => !after(l) && l.data.skills.includes(lab.track)),
    ...(await lessonsFor('poker', lab.track)),
  ];
}

/** The poker lessons, or the work cases, that train a track. */
export async function lessonsFor(course: 'poker' | 'case', track: SkillId): Promise<LessonEntry[]> {
  return (await lessonPath(course)).filter((l) => l.data.game === course && l.data.skills.includes(track));
}

/** The chess lessons whose answers count towards a track. */
export async function chessLessonsFor(track: SkillId): Promise<LessonEntry[]> {
  const chess = (await lessonPath()).filter((l) => l.data.game === 'chess');
  const steps = await Promise.all(chess.map(playedSteps));
  return chess.filter((_, i) => steps[i]!.some((step) => isGraded(step) && trackOf(step.measures) === track));
}
