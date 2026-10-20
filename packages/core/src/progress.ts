import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { CheckInResult, PlanRecord } from './plans';
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

/** A drill's scores: the best ever, the latest, how often, and when it was last done. */
export interface DrillRecord {
  drillId: string;
  best: number;
  last: number;
  times: number;
  lastAt: Date;
}

/** A graded answer: which skill it shows, how it went, when, and where (a lesson, review, practice or drill). */
export interface AttemptRecord {
  skill: string;
  outcome: Outcome;
  at: Date;
  source: 'lesson' | 'review' | 'practice' | 'drill';
  /** The question answered and the chance of guessing it, for the profile's level (see profile.ts). */
  item?: string | undefined;
  chance?: number | undefined;
  /** How sure the learner said they were, when asked (see calibration.ts). */
  confidence?: number | undefined;
}

interface ProgressDB extends DBSchema {
  lessons: { key: string; value: LessonRecord };
  cards: { key: string; value: CardRecord };
  drills: { key: string; value: DrillRecord };
  attempts: { key: number; value: AttemptRecord };
  plans: { key: string; value: PlanRecord };
}

const STORES = ['lessons', 'cards', 'drills', 'attempts', 'plans'] as const;

export type { ProgressExport };

/**
 * The FSRS scheduler loads only when progress is written, so pages that just
 * read progress (the lesson list, the progress page) do not download it.
 */
const scheduler = () => import('./srs');

export type ProgressStore = Awaited<ReturnType<typeof openProgress>>;

export async function openProgress(name = 'chaalwise') {
  // Each version only adds stores, so a device on any older version upgrades without losing anything.
  const db: IDBPDatabase<ProgressDB> = await openDB<ProgressDB>(name, 4, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('lessons', { keyPath: 'lessonId' });
        db.createObjectStore('cards', { keyPath: 'id' });
      }
      if (oldVersion < 2) db.createObjectStore('drills', { keyPath: 'drillId' });
      if (oldVersion < 3) db.createObjectStore('attempts', { autoIncrement: true });
      if (oldVersion < 4) db.createObjectStore('plans', { keyPath: 'id' });
    },
    // A newer version of the app, open in another tab, needs to upgrade: get out of its way.
    blocking() {
      db.close();
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

    /**
     * An answer given in practice, away from the review. It adds the question
     * to the review if it is not there yet, and reschedules it only when it is
     * due: practising early must not push a card's next showing around.
     */
    async recordPractice(id: string, result: Outcome, now: Date) {
      const { newCard, schedule } = await scheduler();
      const tx = db.transaction('cards', 'readwrite');
      const record = await tx.store.get(id);
      if (!record) await tx.store.put({ id, card: schedule(newCard(now), result, now) });
      else if (isDue(record.card, now)) await tx.store.put({ id, card: schedule(record.card, result, now) });
      await tx.done;
    },

    async recordReview(id: string, result: Outcome, now: Date) {
      const { schedule } = await scheduler();
      const tx = db.transaction('cards', 'readwrite');
      const record = await tx.store.get(id);
      if (record) await tx.store.put({ id, card: schedule(record.card, result, now) });
      await tx.done;
    },

    async recordDrill(drillId: string, score: number, now: Date) {
      const tx = db.transaction('drills', 'readwrite');
      const previous = await tx.store.get(drillId);
      await tx.store.put({
        drillId,
        best: Math.max(score, previous?.best ?? score),
        last: score,
        times: (previous?.times ?? 0) + 1,
        lastAt: now,
      });
      await tx.done;
    },

    /** One graded answer, for the skill profile. */
    async recordAttempt(attempt: AttemptRecord) {
      await db.add('attempts', attempt);
    },

    async attemptsBySkill(): Promise<Record<string, AttemptRecord[]>> {
      const bySkill: Record<string, AttemptRecord[]> = {};
      for (const attempt of await db.getAll('attempts')) (bySkill[attempt.skill] ??= []).push(attempt);
      return bySkill;
    },

    async drills(): Promise<Record<string, Omit<DrillRecord, 'drillId'>>> {
      return Object.fromEntries((await db.getAll('drills')).map(({ drillId, ...rest }) => [drillId, rest]));
    },

    /** Save a plan; saving the same step's plan again rewrites it and keeps its check-ins. */
    async savePlan(plan: Omit<PlanRecord, 'checkIns'>) {
      const tx = db.transaction('plans', 'readwrite');
      const previous = await tx.store.get(plan.id);
      await tx.store.put({ ...plan, checkIns: previous?.checkIns ?? [] });
      await tx.done;
    },

    async checkInPlan(id: string, result: CheckInResult, now: Date) {
      const tx = db.transaction('plans', 'readwrite');
      const plan = await tx.store.get(id);
      if (plan) await tx.store.put({ ...plan, checkIns: [...plan.checkIns, { at: now, result }] });
      await tx.done;
    },

    async plans(): Promise<PlanRecord[]> {
      return db.getAll('plans');
    },

    async exportData(now: Date): Promise<ProgressExport> {
      return {
        app: 'chaalwise',
        version: 1,
        exportedAt: now,
        lessons: await db.getAll('lessons'),
        cards: await db.getAll('cards'),
        drills: await db.getAll('drills'),
        attempts: await db.getAll('attempts'),
        plans: await db.getAll('plans'),
      };
    },

    /** Replaces everything on this device with the file's contents. */
    async importData(data: unknown) {
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
        tx.done,
      ]);
    },
  };
}

/**
 * True when a newer version of the app, open in another tab, has already
 * upgraded the database: this tab must reload before it can save.
 */
export const isNewerVersionOpen = (error: unknown): boolean => error instanceof Error && error.name === 'VersionError';

/** Ask the browser not to evict progress (Safari clears unused sites after 7 days). */
export async function requestPersistence(): Promise<boolean> {
  if (!navigator.storage?.persist) return false;
  return (await navigator.storage.persisted()) || navigator.storage.persist();
}
