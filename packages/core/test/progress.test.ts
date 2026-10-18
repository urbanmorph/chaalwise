import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { openProgress, type ProgressStore } from '../src/progress';

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
