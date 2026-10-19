import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { openDB } from 'idb';
import { isNewerVersionOpen, openProgress, type ProgressStore } from '../src/progress';

const now = new Date('2026-10-18T09:00:00Z');
const later = new Date('2026-11-30T09:00:00Z');
let n = 0;
let store: ProgressStore;
const fresh = async () => (store = await openProgress(`test-${++n}`));

afterEach(() => store?.close());

describe('on-device progress', () => {
  it('starts empty', async () => {
    await fresh();
    expect(await store.completedLessons()).toEqual(new Set());
    expect(await store.dueCards(now)).toEqual([]);
  });

  it('remembers a finished lesson and makes a card for each graded step', async () => {
    await fresh();
    await store.recordLesson('chess/board', { corner: 'first-try', push: 'missed' }, now);
    expect(await store.completedLessons()).toEqual(new Set(['chess/board']));
    expect(await store.dueCards(now)).toEqual([]);
    const due = await store.dueCards(later);
    expect(due.map((c) => c.id).sort()).toEqual(['chess/board/corner', 'chess/board/push']);
  });

  it('reschedules a card after a review', async () => {
    await fresh();
    await store.recordLesson('chess/board', { corner: 'missed' }, now);
    const [card] = await store.dueCards(later);
    await store.recordReview(card!.id, 'first-try', later);
    expect(await store.dueCards(later)).toEqual([]);
  });

  it('round-trips through a JSON export, dates included', async () => {
    await fresh();
    await store.recordLesson('chess/board', { corner: 'first-try' }, now);
    const exported = JSON.parse(JSON.stringify(await store.exportData(now)));
    expect(exported).toMatchObject({ app: 'chaalwise', version: 1 });

    const other = await openProgress(`test-${++n}`);
    await other.importData(exported);
    expect(await other.completedLessons()).toEqual(new Set(['chess/board']));
    const [card] = await other.dueCards(later);
    expect(card!.card.due).toBeInstanceOf(Date);
    other.close();
  });

  it('refuses a file that is not a Chaalwise export, and keeps what it had', async () => {
    await fresh();
    await store.recordLesson('chess/board', { corner: 'first-try' }, now);
    await expect(store.importData({ app: 'something-else' })).rejects.toThrow();
    expect(await store.completedLessons()).toEqual(new Set(['chess/board']));
  });
});

describe('drill scores', () => {
  it('keeps the best and latest score of each drill, and when it was last done', async () => {
    await fresh();
    await store.recordDrill('coordinates', 12, now);
    await store.recordDrill('coordinates', 9, later);
    expect(await store.drills()).toEqual({
      coordinates: { best: 12, last: 9, times: 2, lastAt: later },
    });
  });

  it('carries drill scores through an export', async () => {
    await fresh();
    await store.recordDrill('safety', 7, now);
    const exported = JSON.parse(JSON.stringify(await store.exportData(now)));
    const other = await openProgress(`test-${++n}`);
    await other.importData(exported);
    expect((await other.drills()).safety?.best).toBe(7);
    other.close();
  });

  it('still reads an export made before drills existed', async () => {
    await fresh();
    const old = { app: 'chaalwise', version: 1, exportedAt: now.toISOString(), lessons: [], cards: [] };
    await store.importData(old);
    expect(await store.drills()).toEqual({});
  });

  it('upgrades a device that has version 1 progress without losing it', async () => {
    const name = `test-${++n}`;
    const v1 = await openDB(name, 1, {
      upgrade(db) {
        db.createObjectStore('lessons', { keyPath: 'lessonId' });
        db.createObjectStore('cards', { keyPath: 'id' });
      },
    });
    await v1.put('lessons', { lessonId: 'chess/board', completedAt: now, times: 1, outcomes: {} });
    v1.close();
    store = await openProgress(name);
    expect(await store.completedLessons()).toEqual(new Set(['chess/board']));
    await store.recordDrill('coordinates', 5, now);
    expect((await store.drills()).coordinates?.best).toBe(5);
  });
});

describe('more than one version open at once', () => {
  it('says plainly when a newer version of the app has upgraded the database', async () => {
    const name = `test-${++n}`;
    (await openDB(name, 99)).close();
    const error = await openProgress(name).catch((e: unknown) => e);
    expect(isNewerVersionOpen(error)).toBe(true);
    expect(isNewerVersionOpen(new Error('disk full'))).toBe(false);
  });

  it('steps aside when a newer version needs to upgrade, instead of blocking it', async () => {
    const name = `test-${++n}`;
    store = await openProgress(name);
    const newer = await openDB(name, 99);
    expect(newer.version).toBe(99);
    newer.close();
  });
});

describe('attempts for the skill profile', () => {
  it('logs each attempt with its skill, and reads them back by skill', async () => {
    await fresh();
    await store.recordAttempt({ skill: 'safety', outcome: 'first-try', at: now, source: 'lesson' });
    await store.recordAttempt({ skill: 'safety', outcome: 'missed', at: later, source: 'drill' });
    await store.recordAttempt({ skill: 'board', outcome: 'first-try', at: now, source: 'drill' });
    const bySkill = await store.attemptsBySkill();
    expect(bySkill.safety?.map((a) => a.outcome)).toEqual(['first-try', 'missed']);
    expect(bySkill.board).toHaveLength(1);
  });

  it('carries attempts through an export, and reads an export from before they existed', async () => {
    await fresh();
    await store.recordAttempt({ skill: 'safety', outcome: 'first-try', at: now, source: 'lesson' });
    const exported = JSON.parse(JSON.stringify(await store.exportData(now)));
    const other = await openProgress(`test-${++n}`);
    await other.importData(exported);
    expect((await other.attemptsBySkill()).safety?.[0]?.at).toEqual(now);
    await other.importData({ app: 'chaalwise', version: 1, exportedAt: now.toISOString(), lessons: [], cards: [] });
    expect(await other.attemptsBySkill()).toEqual({});
    other.close();
  });

  it('upgrades a version 2 device without losing anything', async () => {
    const name = `test-${++n}`;
    const v2 = await openDB(name, 2, {
      upgrade(db) {
        db.createObjectStore('lessons', { keyPath: 'lessonId' });
        db.createObjectStore('cards', { keyPath: 'id' });
        db.createObjectStore('drills', { keyPath: 'drillId' });
      },
    });
    await v2.put('drills', { drillId: 'safety', best: 7, last: 7, times: 1, lastAt: now });
    v2.close();
    store = await openProgress(name);
    expect((await store.drills()).safety?.best).toBe(7);
    await store.recordAttempt({ skill: 'safety', outcome: 'first-try', at: now, source: 'drill' });
    expect((await store.attemptsBySkill()).safety).toHaveLength(1);
  });
});
