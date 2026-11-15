import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { JournalEntry } from './journal';
import type { LaterRecord } from './later';
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

export interface ProgressDB extends DBSchema {
  lessons: { key: string; value: LessonRecord };
  cards: { key: string; value: CardRecord };
  drills: { key: string; value: DrillRecord };
  attempts: { key: number; value: AttemptRecord };
  plans: { key: string; value: PlanRecord };
  journal: { key: string; value: JournalEntry };
  later: { key: string; value: LaterRecord };
}

export type { ProgressExport };

/**
 * The FSRS scheduler loads only when progress is written, so pages that just
 * read progress (the lesson list, the progress page) do not download it.
 */
const scheduler = () => import('./srs');
/** The progress file's round trip, likewise loaded only by the progress page. */
const io = () => import('./progress-io');

export type ProgressStore = Awaited<ReturnType<typeof openProgress>>;

export async function openProgress(name = 'chaalwise') {
  // Each version only adds stores, so a device on any older version upgrades without losing anything.
  const db: IDBPDatabase<ProgressDB> = await openDB<ProgressDB>(name, 6, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('lessons', { keyPath: 'lessonId' });
        db.createObjectStore('cards', { keyPath: 'id' });
      }
      if (oldVersion < 2) db.createObjectStore('drills', { keyPath: 'drillId' });
      if (oldVersion < 3) db.createObjectStore('attempts', { autoIncrement: true });
      if (oldVersion < 4) db.createObjectStore('plans', { keyPath: 'id' });
      if (oldVersion < 5) db.createObjectStore('journal', { keyPath: 'id' });
      if (oldVersion < 6) db.createObjectStore('later', { keyPath: 'caseId' });
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
      // Each question's step id is its review card (see the question corpus).
      for (const [id, result] of Object.entries(outcomes)) {
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

    /** The answer to a check-in's second question changes its first: noticed, then acted. */
    async amendCheckIn(id: string, result: CheckInResult) {
      const tx = db.transaction('plans', 'readwrite');
      const plan = await tx.store.get(id);
      const last = plan?.checkIns.at(-1);
      if (plan && last) await tx.store.put({ ...plan, checkIns: [...plan.checkIns.slice(0, -1), { ...last, result }] });
      await tx.done;
    },

    async plans(): Promise<PlanRecord[]> {
      return db.getAll('plans');
    },

    /** Write a journal entry, or rewrite it (a decision once looked back on). */
    async writeJournal(entry: JournalEntry) {
      await db.put('journal', entry);
    },

    async journal(): Promise<JournalEntry[]> {
      return db.getAll('journal');
    },

    async deleteJournal(id: string) {
      await db.delete('journal', id);
    },

    /** A case a week later, done: whether the learner used its idea unprompted. Review offers each case once. */
    async recordLater(record: LaterRecord) {
      await db.put('later', record);
    },

    /** Every record in a store: the finished lessons (with when), or the cases a week later. */
    records<S extends 'lessons' | 'later'>(store: S) {
      return db.getAll(store);
    },

    async exportData(now: Date): Promise<ProgressExport> {
      return (await io()).exportFrom(db, now);
    },

    /** Replaces everything on this device with the file's contents. */
    async importData(data: unknown) {
      await (await io()).importInto(db, data);
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
