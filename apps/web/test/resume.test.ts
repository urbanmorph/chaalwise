import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearResume, exportResume, importResume, readResume, RESUME_KEY, saveResume } from '../src/lib/resume';

const STEPS = ['intro', 'q1', 'q2', 'plan'];

afterEach(() => vi.unstubAllGlobals());

beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
});

describe('where a learner left a lesson', () => {
  it('keeps the step reached and the answers so far, per lesson', () => {
    saveResume('strategy/a', STEPS, 2, { q1: 'first-try' });
    saveResume('chess/b', ['x', 'y'], 1, {});
    expect(readResume('strategy/a', STEPS)).toEqual({ index: 2, outcomes: { q1: 'first-try' } });
    expect(readResume('chess/b', ['x', 'y'])).toEqual({ index: 1, outcomes: {} });
  });

  it('has nothing to offer at the very start, and saving the start keeps what was there', () => {
    expect(readResume('strategy/a', STEPS)).toBeUndefined();
    saveResume('strategy/a', STEPS, 2, { q1: 'missed' });
    saveResume('strategy/a', STEPS, 0, {});
    expect(readResume('strategy/a', STEPS)?.index).toBe(2);
  });

  it('forgets the place once the lesson is finished or started again', () => {
    saveResume('strategy/a', STEPS, 2, {});
    saveResume('chess/b', ['x', 'y'], 1, {});
    clearResume('strategy/a');
    expect(readResume('strategy/a', STEPS)).toBeUndefined();
    expect(readResume('chess/b', ['x', 'y'])).toBeDefined();
  });

  it('drops a place that no longer fits a lesson that has changed since', () => {
    saveResume('strategy/a', STEPS, 3, { q1: 'first-try', q2: 'missed' });
    // The step reached has gone, or moved: start from the beginning.
    expect(readResume('strategy/a', ['intro', 'q1', 'q2'])).toBeUndefined();
    expect(readResume('strategy/a', ['intro', 'new', 'q1', 'q2', 'plan'])).toBeUndefined();
    // Still there: carry on, keeping only the answers to steps the lesson still has.
    expect(readResume('strategy/a', ['intro', 'q1', 'new', 'plan'])).toEqual({
      index: 3,
      outcomes: { q1: 'first-try' },
    });
  });

  it('copes with blocked storage or a damaged record', () => {
    localStorage.setItem(RESUME_KEY, '{not json');
    expect(readResume('strategy/a', STEPS)).toBeUndefined();
    saveResume('strategy/a', STEPS, 1, {});
    expect(readResume('strategy/a', STEPS)?.index).toBe(1);
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    });
    expect(readResume('strategy/a', STEPS)).toBeUndefined();
    expect(() => saveResume('strategy/a', STEPS, 1, {})).not.toThrow();
    expect(() => clearResume('strategy/a')).not.toThrow();
  });
});

describe('the place in each lesson, in the progress file', () => {
  it('goes into the file, and comes back from it on another device', () => {
    saveResume('strategy/a', STEPS, 2, { q1: 'first-try' });
    const file = JSON.parse(JSON.stringify(exportResume()));
    localStorage.removeItem(RESUME_KEY);
    importResume(file);
    expect(readResume('strategy/a', STEPS)).toEqual({ index: 2, outcomes: { q1: 'first-try' } });
  });

  it('replaces the places on this device, like the rest of the file; a file with none clears them', () => {
    saveResume('chess/b', ['x', 'y'], 1, {});
    importResume({ 'strategy/a': { index: 1, step: 'q1', outcomes: {} } });
    expect(readResume('chess/b', ['x', 'y'])).toBeUndefined();
    expect(readResume('strategy/a', STEPS)?.index).toBe(1);
    // Files saved before October 2026 have no places at all.
    importResume(undefined);
    expect(localStorage.getItem(RESUME_KEY)).toBeNull();
  });

  it('keeps only well-formed places from a file', () => {
    importResume({
      'strategy/a': { index: 2, step: 'q2', outcomes: { q1: 'first-try', q2: 'won' } },
      'chess/b': { index: 'two', step: 'y', outcomes: {} },
      'chess/c': { index: 1, outcomes: {} },
      'chess/d': 'step 3',
    });
    expect(Object.keys(exportResume())).toEqual(['strategy/a']);
    expect(readResume('strategy/a', STEPS)).toEqual({ index: 2, outcomes: { q1: 'first-try' } });
    importResume([1, 2]);
    expect(exportResume()).toEqual({});
  });
});
