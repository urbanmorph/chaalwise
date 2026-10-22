import { COUNT_KEY } from './count-key';

export { COUNT_KEY };

/** The live site, as in analytics.ts (a test keeps them equal): importing it would move the page script out of line. */
export const COUNT_HOST = 'chaalwise.com';

/**
 * Anonymous counts of what is finished: a lesson, a lab played to the end, a drill,
 * a practice hand, a review or practice round. Each sends only its name, such as
 * `played:labs/nim`; the counter adds one to that name's total for the day. No
 * ID, cookie or anything about the learner is sent, and progress stays on the
 * device. Only on the live site, and silently dropped when offline.
 */
export function count(key: string): void {
  if (!COUNT_KEY.test(key)) return;
  try {
    if (location.host === COUNT_HOST) navigator.sendBeacon?.('/api/count', key);
  } catch {
    // A count is never worth an error in a lesson.
  }
}
