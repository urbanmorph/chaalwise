/**
 * A quick copy of which lessons are finished on this device, so a lesson page
 * can draw its "builds on earlier lessons" note before the first paint, when
 * the full record (IndexedDB) cannot be read yet. The full record is the truth:
 * every lesson page copies it here again. Progress never leaves the device.
 */
export const DONE_KEY = 'chaalwise-done';

export function saveDone(ids: Iterable<string>): void {
  try {
    localStorage.setItem(DONE_KEY, JSON.stringify([...ids]));
  } catch {
    // Storage can be blocked; the note then falls back to a new learner's.
  }
}

export function addDone(id: string): void {
  try {
    const ids: string[] = JSON.parse(localStorage.getItem(DONE_KEY) ?? '[]');
    saveDone(new Set([...ids, id]));
  } catch {
    saveDone([id]);
  }
}
