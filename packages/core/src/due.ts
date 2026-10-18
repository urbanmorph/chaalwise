import type { Card } from 'ts-fsrs';

/** Kept apart from the scheduler, so reading progress does not load FSRS. */
export const isDue = (card: Card, now: Date): boolean => card.due.getTime() <= now.getTime();
