import { createEmptyCard, fsrs, Rating, type Card, type Grade } from 'ts-fsrs';

export { State, type Card } from 'ts-fsrs';
import type { Outcome } from './player';

/**
 * Spaced repetition with FSRS. Short-term steps are off: the lesson itself is
 * the first exposure, so a card's next showing is on a later day.
 */
const scheduler = fsrs({ enable_short_term: false });

const GRADE: Record<Outcome, Grade> = {
  'first-try': Rating.Good,
  'with-help': Rating.Hard,
  missed: Rating.Again,
};

export const newCard = (now: Date): Card => createEmptyCard(now);

export const schedule = (card: Card, outcome: Outcome, now: Date): Card =>
  scheduler.next(card, now, GRADE[outcome]).card;
