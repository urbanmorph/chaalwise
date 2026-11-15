import { openProgress } from '@chaalwise/core/progress';
import { addDone } from './done-lessons';
import { count } from './count';

/**
 * Record that the learner has met a game: played chess's first moves, or a lab.
 * Kept as a finished record (so it is in the export) and in the quick copy (so
 * a lesson page knows before its first paint). See games.ts. The quick copy is
 * written once the record is saved (or cannot be), so it never says more than
 * the record: a page that sees it may be left at once.
 */
export async function markMet(id: string): Promise<void> {
  try {
    const progress = await openProgress();
    await progress.recordLesson(id, {}, new Date());
    progress.close();
    count(`played:${id}`);
  } catch (error) {
    console.error(error);
  }
  addDone(id);
}
