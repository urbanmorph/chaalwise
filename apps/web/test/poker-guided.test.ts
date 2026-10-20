import { legalMoves, type Table } from '@chaalwise/poker/table';
import { describe, expect, it } from 'vitest';
import { gamesMet } from '../src/lib/games';
import { GUIDED, coachFor, learnerTurn, startGuided, step } from '../src/lib/poker/guided';

/** Play a guided hand taking every move the coach suggests. */
const followCoach = (index: number): Table => {
  let table = learnerTurn(startGuided(index), GUIDED[index]!);
  while (!table.result) table = learnerTurn(step(table, coachFor(table, GUIDED[index]!).suggest), GUIDED[index]!);
  return table;
};

describe('the guided hands that open poker', () => {
  it('deal exactly the cards each hand is written for', () => {
    for (const [i, hand] of GUIDED.entries()) {
      const table = startGuided(i);
      expect(table.seats[0]!.cards, hand.id).toEqual(hand.you);
      expect(table.seats[1]!.cards, hand.id).toEqual(hand.bot);
    }
  });

  it('only ever suggest a legal move, with a reason', () => {
    for (const [i, hand] of GUIDED.entries()) {
      let table = learnerTurn(startGuided(i), hand);
      while (!table.result) {
        const { suggest, why, notice } = coachFor(table, hand);
        expect(legalMoves(table), `${hand.id} ${table.street}`).toContain(suggest);
        expect(why.length + notice.length).toBeGreaterThan(20);
        table = learnerTurn(step(table, suggest), hand);
      }
    }
  });

  it('end the way each hand teaches when the learner takes the advice', () => {
    // A pair of kings beats a pair of queens at the showdown.
    const kings = followCoach(0);
    expect(kings.result!.winners).toEqual([0]);
    expect(kings.result!.hands[0]!.name).toBe('a pair of kings');
    // Folding a weak hand to a raise costs only the blind.
    const fold = followCoach(1);
    expect(fold.result!.byFold).toBe(true);
    expect(fold.seats[0]!.points).toBe(200 - 1);
    // The flush draw comes in and beats a pair of kings.
    const flush = followCoach(2);
    expect(flush.result!.winners).toEqual([0]);
    expect(flush.result!.hands[0]!.category).toBe('flush');
  });

  it('count the outs for the flush draw from the cards themselves', () => {
    const hand = GUIDED[2]!;
    let table = learnerTurn(startGuided(2), hand);
    while (table.street === 'preflop') table = learnerTurn(step(table, coachFor(table, hand).suggest), hand);
    expect(coachFor(table, hand).notice).toMatch(/9 outs/);
    expect(coachFor(table, hand).notice).toMatch(/36%/);
  });

  it('meet poker once played', () => {
    expect(gamesMet(new Set(['poker/first-hands']))).toEqual(new Set(['poker']));
  });
});
