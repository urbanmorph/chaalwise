import type { GradedStep } from '@chaalwise/core/lesson';
import { getCollection, type CollectionEntry } from 'astro:content';
import { parseMoveText, positionFromMoves, toSan } from './chess';
import { safetyVerdict } from './drills';

export type LessonEntry = CollectionEntry<'lessons'>;

/** Chess lessons in curriculum order: by stage, then by order within the stage. */
export async function chessLessons(): Promise<LessonEntry[]> {
  return (await getCollection('lessons', (l) => l.data.game === 'chess')).sort(
    (a, b) => a.data.stage - b.data.stage || a.data.order - b.data.order,
  );
}

export const lessonHref = (lesson: LessonEntry) => `/${lesson.id}/`;

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

/** Every review question the site has, keyed by card id (`<lessonId>/<stepId>`). */
export async function reviewSteps(): Promise<Record<string, GradedStep>> {
  const steps: Record<string, GradedStep> = {};
  for (const lesson of await chessLessons()) {
    for (const step of lesson.data.steps) {
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
