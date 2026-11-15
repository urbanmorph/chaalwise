import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DONE_KEY, readDone } from '../src/lib/done-lessons';
import { markMet } from '../src/lib/meet';

/** The finished record, saved when `save` is called, as IndexedDB saves after the page has moved on. */
const record = vi.hoisted(() => ({ lessons: new Set<string>(), save: () => {}, fail: false }));
vi.mock('@chaalwise/core/progress', () => ({
  openProgress: async () => ({
    recordLesson: (id: string) =>
      new Promise<void>((resolve, reject) => {
        record.save = () => {
          if (record.fail) return reject(new Error('storage blocked'));
          record.lessons.add(id);
          resolve();
        };
      }),
    close: () => {},
  }),
}));

afterEach(() => vi.unstubAllGlobals());

beforeEach(() => {
  record.lessons.clear();
  record.fail = false;
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

const saved = () => new Promise((resolve) => setTimeout(resolve));

describe('meeting a game', () => {
  it('writes the quick copy only once the finished record is saved, so leaving the page then loses nothing', async () => {
    const met = markMet('labs/nim');
    await saved();
    expect(localStorage.getItem(DONE_KEY)).toBeNull();
    record.save();
    await met;
    expect(record.lessons).toContain('labs/nim');
    expect(readDone()).toContain('labs/nim');
  });

  it('still writes the quick copy when the record cannot be saved', async () => {
    record.fail = true;
    const met = markMet('labs/nim');
    await saved();
    record.save();
    await met;
    expect(readDone()).toContain('labs/nim');
  });
});
