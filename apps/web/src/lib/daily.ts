import { isObject } from './is-object';
import { THEMES } from './puzzles';

/**
 * Today's puzzles: the same for everyone on a day, chosen from the date, so they
 * work offline and need nothing from a server. The chess puzzle comes from the
 * puzzles shipped with the site, a different theme each day of the week, at one
 * of the three easier levels. Days are the learner's own calendar days.
 */

/** Today as YYYY-MM-DD, in the learner's own time zone. */
export const today = (now = new Date()): string =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

/** Days since 1970 for a YYYY-MM-DD date, counted in UTC so every time zone agrees. */
const dayNumber = (date: string): number => Math.round(Date.parse(`${date}T00:00:00Z`) / 86_400_000);

/** A well-mixed whole number from a day, so neighbouring days pick far-apart puzzles. */
const mix = (n: number): number => {
  let h = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
};

/** Which shipped puzzle is today's: a theme, a level, and a position in that set (taken modulo its size once loaded). */
export function dailyChess(date: string) {
  const day = dayNumber(date);
  const theme = THEMES[((day % THEMES.length) + THEMES.length) % THEMES.length]!;
  const band = theme.bands[mix(day) % 3]!;
  return { theme, band, index: mix(day + 7919) };
}

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

function writeDaily(record: DailyRecord): void {
  try {
    if (record.streak || Object.keys(record.done).length) localStorage.setItem(DAILY_KEY, JSON.stringify(record));
    else localStorage.removeItem(DAILY_KEY);
  } catch {
    // Storage can be blocked: the puzzle still works, without a streak.
  }
}

/** The streak and today's results, for the progress file; nothing on a device that has never finished one. */
export function exportDaily(): DailyRecord | undefined {
  const record = readDaily();
  return record.streak || Object.keys(record.done).length ? record : undefined;
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
