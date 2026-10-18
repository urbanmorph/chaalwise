import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Outcome } from './player';
import type { ProgressExport } from './progress-file';
import { isDue } from './due';
import type { Card } from './srs';

/**
 * Learner progress, kept in IndexedDB on this device only. It never leaves the
 * device except as a file the learner exports themselves.
 */

export interface LessonRecord {
  lessonId: string;
  completedAt: Date;
  times: number;
  outcomes: Record<string, Outcome>;
}

export interface CardRecord {
  /** `<lessonId>/<stepId>` */
  id: string;
  card: Card;
}

interface ProgressDB extends DBSchema {
  lessons: { key: string; value: LessonRecord };
  cards: { key: string; value: CardRecord };
}

export type { ProgressExport };

/**
 * The FSRS scheduler loads only when progress is written, so pages that just
 * read progress (the lesson list, the progress page) do not download it.
 */
const scheduler = () => import('./srs');

export type ProgressStore = Awaited<ReturnType<typeof openProgress>>;

export async function openProgress(name = 'chaalwise') {
  const db: IDBPDatabase<ProgressDB> = await openDB<ProgressDB>(name, 1, {
    upgrade(db) {
      db.createObjectStore('lessons', { keyPath: 'lessonId' });
      db.createObjectStore('cards', { keyPath: 'id' });
    },
  });

  return {
    close: () => db.close(),

    async completedLessons(): Promise<Set<string>> {
      return new Set(await db.getAllKeys('lessons'));
    },

    async recordLesson(lessonId: string, outcomes: Record<string, Outcome>, now: Date) {
      const { newCard, schedule } = await scheduler();
      const tx = db.transaction(['lessons', 'cards'], 'readwrite');
      const lessons = tx.objectStore('lessons');
      const cards = tx.objectStore('cards');
      const previous = await lessons.get(lessonId);
      await lessons.put({
        lessonId,
        completedAt: now,
        times: (previous?.times ?? 0) + 1,
        outcomes,
      });
      for (const [stepId, result] of Object.entries(outcomes)) {
        const id = `${lessonId}/${stepId}`;
        const card = (await cards.get(id))?.card ?? newCard(now);
        await cards.put({ id, card: schedule(card, result, now) });
      }
      await tx.done;
    },

    async dueCards(now: Date): Promise<CardRecord[]> {
      return (await db.getAll('cards')).filter((c) => isDue(c.card, now));
    },

    async recordReview(id: string, result: Outcome, now: Date) {
      const { schedule } = await scheduler();
      const tx = db.transaction('cards', 'readwrite');
      const record = await tx.store.get(id);
      if (record) await tx.store.put({ id, card: schedule(record.card, result, now) });
      await tx.done;
    },

    async exportData(now: Date): Promise<ProgressExport> {
      return {
        app: 'chaalwise',
        version: 1,
        exportedAt: now,
        lessons: await db.getAll('lessons'),
        cards: await db.getAll('cards'),
      };
    },

    /** Replaces everything on this device with the file's contents. */
    async importData(data: unknown) {
      // The validator loads only when needed, keeping zod out of every page's bundle.
      const { exportSchema } = await import('./progress-file');
      const parsed = exportSchema.parse(data);
      const tx = db.transaction(['lessons', 'cards'], 'readwrite');
      // One wait for every request and the commit, so a failed write cannot go unhandled;
      // requests in one transaction run in order, so the clears happen before the puts.
      await Promise.all([
        tx.objectStore('lessons').clear(),
        tx.objectStore('cards').clear(),
        ...parsed.lessons.map((l) => tx.objectStore('lessons').put(l)),
        ...parsed.cards.map((c) => tx.objectStore('cards').put(c)),
        tx.done,
      ]);
    },
  };
}

/** Ask the browser not to evict progress (Safari clears unused sites after 7 days). */
export async function requestPersistence(): Promise<boolean> {
  if (!navigator.storage?.persist) return false;
  return (await navigator.storage.persisted()) || navigator.storage.persist();
}
