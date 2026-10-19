import { openProgress } from '@chaalwise/core/progress';
import { saveDone } from '../lib/done-lessons';

/** Give every `[data-lesson]` element finished on this device the `done` class, and refresh the quick copy. Progress never leaves the device. */
export async function markDone(): Promise<void> {
  const progress = await openProgress();
  const done = await progress.completedLessons();
  progress.close();
  saveDone(done);
  for (const el of document.querySelectorAll<HTMLElement>('[data-lesson]'))
    el.classList.toggle('done', done.has(el.dataset.lesson!));
}
