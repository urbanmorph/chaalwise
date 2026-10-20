import { createEmptyCard, fsrs, Rating, type Card, type Grade } from 'ts-fsrs';

export { State, type Card } from 'ts-fsrs';
import type { Outcome } from './player';

/**
 * Spaced repetition with FSRS. Short-term steps are off: the lesson itself is
 * the first exposure, so a card's next showing is on a later day. Retention
 * stays at the usual 0.9. Intervals stop at a year: a card stands for an idea
 * shown in changing positions, and skills such as calculation fade, so every
 * idea comes back at least once a year (Cepeda et al. 2008).
 */
const scheduler = fsrs({ enable_short_term: false, maximum_interval: 365 });

const GRADE: Record<Outcome, Grade> = {
  'first-try': Rating.Good,
  'with-help': Rating.Hard,
  missed: Rating.Again,
};

export const newCard = (now: Date): Card => createEmptyCard(now);

export const schedule = (card: Card, outcome: Outcome, now: Date): Card =>
  scheduler.next(card, now, GRADE[outcome]).card;
