import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearResume, readResume, RESUME_KEY, saveResume } from '../src/lib/resume';

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
