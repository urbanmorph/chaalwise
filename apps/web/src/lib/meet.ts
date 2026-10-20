import { openProgress } from '@chaalwise/core/progress';
import { addDone } from './done-lessons';

/**
 * Record that the learner has met a game: played chess's first moves, or a lab.
 * Kept as a finished record (so it is in the export) and in the quick copy (so
 * a lesson page knows before its first paint). See games.ts.
 */
export async function markMet(id: string): Promise<void> {
  addDone(id);
  try {
    const progress = await openProgress();
    await progress.recordLesson(id, {}, new Date());
    progress.close();
  } catch (error) {
    console.error(error);
  }
}
