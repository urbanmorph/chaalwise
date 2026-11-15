import type { IDBPDatabase } from 'idb';
import type { ProgressDB } from './progress';
import type { ProgressExport } from './progress-file';

/**
 * The progress file's round trip, loaded only by the progress page, so the
 * lesson pages that write progress do not carry it.
 */

const STORES = ['lessons', 'cards', 'drills', 'attempts', 'plans', 'journal', 'later'] as const;

export async function exportFrom(db: IDBPDatabase<ProgressDB>, now: Date): Promise<ProgressExport> {
  return {
    app: 'chaalwise',
    version: 1,
    exportedAt: now,
    lessons: await db.getAll('lessons'),
    cards: await db.getAll('cards'),
    drills: await db.getAll('drills'),
    attempts: await db.getAll('attempts'),
    plans: await db.getAll('plans'),
    journal: await db.getAll('journal'),
    later: await db.getAll('later'),
  };
}

/** Replaces everything on this device with the file's contents. */
export async function importInto(db: IDBPDatabase<ProgressDB>, data: unknown) {
  // The validator loads only when needed, keeping zod out of every page's bundle.
  const { exportSchema } = await import('./progress-file');
  const parsed = exportSchema.parse(data);
  const tx = db.transaction(STORES, 'readwrite');
  // One wait for every request and the commit, so a failed write cannot go unhandled;
  // requests in one transaction run in order, so the clears happen before the puts.
  await Promise.all([
    ...STORES.map((store) => tx.objectStore(store).clear()),
    ...parsed.lessons.map((l) => tx.objectStore('lessons').put(l)),
    ...parsed.cards.map((c) => tx.objectStore('cards').put(c)),
    ...parsed.drills.map((d) => tx.objectStore('drills').put(d)),
    ...parsed.attempts.map((a) => tx.objectStore('attempts').add(a)),
    ...parsed.plans.map((p) => tx.objectStore('plans').put(p)),
    ...parsed.journal.map((e) => tx.objectStore('journal').put(e)),
    ...parsed.later.map((l) => tx.objectStore('later').put(l)),
    tx.done,
  ]);
}
