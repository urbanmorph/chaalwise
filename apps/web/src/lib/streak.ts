import { isObject } from './is-object';

/**
 * The daily streak, kept on the device. Apart from the puzzles themselves
 * (daily.ts), so the progress page can save and load it without loading them.
 */

/** Today as YYYY-MM-DD, in the learner's own time zone. */
export const today = (now = new Date()): string =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

/** Days since 1970 for a YYYY-MM-DD date, counted in UTC so every time zone agrees. */
export const dayNumber = (date: string): number => Math.round(Date.parse(`${date}T00:00:00Z`) / 86_400_000);

export interface Streak {
  /** The last day a daily puzzle was finished. */
  last: string;
  streak: number;
  best: number;
}

/** The streak after finishing on `date`: one more after yesterday, one again after a gap, unchanged for a second finish the same day. */
export function nextStreak(prev: Streak | undefined, date: string): Streak {
  if (prev?.last === date) return prev;
  const streak = prev && dayNumber(date) - dayNumber(prev.last) === 1 ? prev.streak + 1 : 1;
  return { last: date, streak, best: Math.max(streak, prev?.best ?? 0) };
}

/**
 * The streak and today's results, in localStorage like the lesson bookmark: a small
 * record that reads before the page paints. It goes into the progress file the
 * learner saves (exportDaily), so a new device keeps the streak; otherwise it
 * never leaves the device.
 */
export const DAILY_KEY = 'chaalwise-daily';
export type DailyKind = 'chess' | 'poker';
export interface DailyRecord {
  streak?: Streak;
  /** The last day each puzzle was finished, and whether it was right first time. */
  done: Partial<Record<DailyKind, { date: string; right: boolean }>>;
}

export function readDaily(): DailyRecord {
  try {
    const saved = JSON.parse(localStorage.getItem(DAILY_KEY) ?? '{}');
    return { done: {}, ...(isObject(saved) ? saved : {}) };
  } catch {
    return { done: {} };
  }
}

/** Record today's puzzle of one kind as finished; the streak counts a day once, whichever puzzle finished it. */
export function finishDaily(kind: DailyKind, date: string, right: boolean): DailyRecord {
  const prev = readDaily();
  const record = { streak: nextStreak(prev.streak, date), done: { ...prev.done, [kind]: { date, right } } };
  writeDaily(record);
  return record;
}

const hasAny = (record: DailyRecord) => !!record.streak || Object.keys(record.done).length > 0;

function writeDaily(record: DailyRecord): void {
  try {
    if (hasAny(record)) localStorage.setItem(DAILY_KEY, JSON.stringify(record));
    else localStorage.removeItem(DAILY_KEY);
  } catch {
    // Storage can be blocked: the puzzle still works, without a streak.
  }
}

/** The streak and today's results, for the progress file; nothing on a device that has never finished one. */
export function exportDaily(): DailyRecord | undefined {
  const record = readDaily();
  return hasAny(record) ? record : undefined;
}

const isDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isCount = (v: unknown): v is number => Number.isInteger(v) && (v as number) > 0;
const KINDS: DailyKind[] = ['chess', 'poker'];

/** Replaces the streak with a progress file's, keeping only well-formed parts; files from before October 2026 have none. */
export function importDaily(fromFile: unknown): void {
  const file = isObject(fromFile) ? fromFile : {};
  const s = isObject(file.streak) ? file.streak : {};
  const streak =
    isDate(s.last) && isCount(s.streak) && isCount(s.best)
      ? { last: s.last, streak: s.streak, best: s.best }
      : undefined;
  const done: DailyRecord['done'] = {};
  const fileDone = isObject(file.done) ? file.done : {};
  for (const kind of KINDS) {
    const d = fileDone[kind];
    if (isObject(d) && isDate(d.date) && typeof d.right === 'boolean') done[kind] = { date: d.date, right: d.right };
  }
  writeDaily(streak ? { streak, done } : { done });
}
