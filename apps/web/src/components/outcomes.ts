import type { Outcome } from '@chaalwise/core/player';

/** "3 of 4 first try", for the end of a lesson or review. */
export function summarise(outcomes: Record<string, Outcome>): string {
  const all = Object.values(outcomes);
  const first = all.filter((o) => o === 'first-try').length;
  return `${first} of ${all.length} first try`;
}
