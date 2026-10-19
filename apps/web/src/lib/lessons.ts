import type { GradedStep } from '@chaalwise/core/lesson';
import { learningPath } from '@chaalwise/core/path';
import { getCollection, type CollectionEntry } from 'astro:content';
import { parseMoveText, positionFromMoves, toSan } from './chess';
import { safetyVerdict } from './drills';

export type LessonEntry = CollectionEntry<'lessons'>;

/** Every lesson, chess and strategy, in the recommended order (see learningPath). */
export async function lessonPath(): Promise<LessonEntry[]> {
  const all = await getCollection('lessons');
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

/** The lesson after this one on the path, and the earlier-stage lessons it builds on. */
export async function pathContext(
  lesson: LessonEntry,
): Promise<{ next: LessonEntry | undefined; buildsOn: LessonEntry[] }> {
  const path = await lessonPath();
  const at = path.findIndex((l) => l.id === lesson.id);
  return { next: path[at + 1], buildsOn: path.slice(0, at).filter((l) => l.data.stage < lesson.data.stage) };
}

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

/** A lesson's steps, each knowing the profile skill its answers count towards (its own, or the lesson's). */
export const stepsWithSkills = (lesson: LessonEntry) =>
  lesson.data.steps.map((step) =>
    step.kind === 'read' ? step : { ...step, measures: step.measures ?? lesson.data.measures },
  );

/** Every review question the site has, keyed by card id (`<lessonId>/<stepId>`). */
export async function reviewSteps(): Promise<Record<string, GradedStep>> {
  const steps: Record<string, GradedStep> = {};
  for (const lesson of await lessonPath()) {
    for (const step of stepsWithSkills(lesson)) {
      if (step.kind !== 'read') steps[`${lesson.id}/${step.id}`] = step;
    }
  }
  return steps;
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
