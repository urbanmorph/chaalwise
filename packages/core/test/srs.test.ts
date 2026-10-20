import { describe, expect, it } from 'vitest';
import { isDue } from '../src/due';
import { newCard, schedule } from '../src/srs';

const day = 24 * 60 * 60 * 1000;
const now = new Date('2026-10-18T09:00:00Z');

describe('spaced repetition', () => {
  it('makes a new card due straight away', () => {
    expect(isDue(newCard(now), now)).toBe(true);
  });

  it('brings a first-try card back on a later day, not later today', () => {
    const card = schedule(newCard(now), 'first-try', now);
    expect(card.due.getTime() - now.getTime()).toBeGreaterThanOrEqual(day);
    expect(isDue(card, now)).toBe(false);
  });

  it('brings a missed card back sooner than one that needed help, and that sooner than a first try', () => {
    const due = (outcome: Parameters<typeof schedule>[1]) => schedule(newCard(now), outcome, now).due.getTime();
    expect(due('missed')).toBeLessThan(due('with-help'));
    expect(due('with-help')).toBeLessThan(due('first-try'));
  });

  it('spaces reviews further apart each time a card is remembered', () => {
    const first = schedule(newCard(now), 'first-try', now);
    const second = schedule(first, 'first-try', first.due);
    const gap1 = first.due.getTime() - now.getTime();
    const gap2 = second.due.getTime() - first.due.getTime();
    expect(gap2).toBeGreaterThan(gap1);
  });

  it('brings every idea back at least once a year, however well it is known', () => {
    let card = schedule(newCard(now), 'first-try', now);
    for (let i = 0; i < 12; i++) card = schedule(card, 'first-try', card.due);
    // ts-fsrs keeps a Good answer a day beyond a Hard one, so the cap of 365 can give 366.
    expect(card.scheduled_days).toBeLessThanOrEqual(366);
  });

  it('does not change the card it is given', () => {
    const card = newCard(now);
    const copy = structuredClone(card);
    schedule(card, 'first-try', now);
    expect(card).toEqual(copy);
  });
});
