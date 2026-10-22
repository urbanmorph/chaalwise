import type { Outcome } from '@chaalwise/core/player';
import { isObject } from './is-object';

/**
 * Where the learner left each unfinished lesson on this device: the step
 * reached and the answers so far, so coming back can carry on from there.
 * Kept in localStorage, not IndexedDB: a lesson page reads it before its first
 * paint (see LessonArticle), so the offer to carry on is drawn with the page
 * and nothing jumps. It is a bookmark, not a record of learning: it is cleared
 * when the lesson is finished or started again. It goes into the progress file
 * the learner saves (exportResume), so a new device carries on from the same
 * place; otherwise it never leaves the device.
 */
export const RESUME_KEY = 'chaalwise-resume';

interface Resume {
  index: number;
  outcomes: Record<string, Outcome>;
}

/** Saved by lesson id, with the id of the step reached, to tell when a lesson has changed since. */
type Saved = Record<string, Resume & { step: string }>;

const OUTCOMES = new Set<string>(['first-try', 'with-help', 'missed'] satisfies Outcome[]);

/** The answers that are real outcomes, to steps `keep` accepts. */
const outcomesIn = (outcomes: unknown, keep: (id: string) => boolean): Record<string, Outcome> =>
  Object.fromEntries(
    Object.entries(isObject(outcomes) ? outcomes : {}).filter(([id, o]) => keep(id) && OUTCOMES.has(o as string)),
  ) as Record<string, Outcome>;

function readAll(): Saved {
  try {
    const all = JSON.parse(localStorage.getItem(RESUME_KEY) ?? '{}');
    return isObject(all) ? (all as Saved) : {};
  } catch {
    return {};
  }
}

function writeAll(all: Saved): void {
  try {
    if (Object.keys(all).length) localStorage.setItem(RESUME_KEY, JSON.stringify(all));
    else localStorage.removeItem(RESUME_KEY);
  } catch {
    // Storage can be blocked: the lesson then starts from the beginning next time.
  }
}

/** Where the learner left this lesson, if anywhere past the start and the lesson's steps are as they were. */
export function readResume(lessonId: string, stepIds: string[]): Resume | undefined {
  const saved = readAll()[lessonId];
  if (!saved || !Number.isInteger(saved.index) || stepIds[saved.index] !== saved.step) return undefined;
  const outcomes = outcomesIn(saved.outcomes, (id) => stepIds.includes(id));
  return saved.index > 0 || Object.keys(outcomes).length ? { index: saved.index, outcomes } : undefined;
}

/** Keep the learner's place. The very start is not a place to come back to, so it leaves what was saved. */
export function saveResume(lessonId: string, stepIds: string[], index: number, outcomes: Record<string, Outcome>) {
  if (index === 0 && !Object.keys(outcomes).length) return;
  const step = stepIds[index];
  if (step === undefined) return;
  writeAll({ ...readAll(), [lessonId]: { index, step, outcomes } });
}

export function clearResume(lessonId: string): void {
  const all = readAll();
  delete all[lessonId];
  writeAll(all);
}

/** Every place, for the progress file. */
export const exportResume = (): Saved => readAll();

/** Replaces every place with a progress file's, keeping only well-formed ones; files from before October 2026 have none. */
export function importResume(fromFile: unknown): void {
  const all: Saved = {};
  for (const [id, saved] of Object.entries(isObject(fromFile) ? fromFile : {})) {
    if (!isObject(saved) || !Number.isInteger(saved.index) || typeof saved.step !== 'string') continue;
    all[id] = { index: saved.index as number, step: saved.step, outcomes: outcomesIn(saved.outcomes, () => true) };
  }
  writeAll(all);
}
