import { describe, expect, it } from 'vitest';
import {
  botTake,
  drawPiles,
  GAMES,
  MAX_PILE,
  MIN_PILE,
  review,
  starter,
  TAKES,
  winningMove,
} from '../src/lib/labs/nim';
import { seeded } from '../src/lib/labs/seeded';

/** Does the bot take the last counter, whatever the learner does? Tries every learner move. */
function botAlwaysWins(pile: number, botToMove: boolean): boolean {
  if (pile === 0) return !botToMove;
  if (botToMove) return botAlwaysWins(pile - botTake(pile), false);
  return TAKES.filter((t) => t <= pile).every((t) => botAlwaysWins(pile - t, true));
}

/** Does a learner who always leaves a multiple of 4 beat the bot from here? */
function perfectLearnerWins(pile: number, learnerToMove: boolean): boolean {
  if (pile === 0) return !learnerToMove;
  const take = learnerToMove ? winningMove(pile)! : botTake(pile);
  return perfectLearnerWins(pile - take, !learnerToMove);
}

describe('Nim: take 1, 2 or 3; whoever takes the last counter wins', () => {
  it('has a winning move exactly when the pile is not a multiple of 4: the one that leaves a multiple of 4', () => {
    for (let pile = 1; pile <= MAX_PILE; pile++) {
      const move = winningMove(pile);
      if (pile % 4 === 0) expect(move, `pile ${pile}`).toBeUndefined();
      else {
        expect(TAKES).toContain(move);
        expect((pile - move!) % 4, `pile ${pile}`).toBe(0);
      }
    }
  });

  it('the bot leaves a multiple of 4 when it can, and takes 1 when it cannot', () => {
    expect(botTake(13)).toBe(1);
    expect(botTake(14)).toBe(2);
    expect(botTake(15)).toBe(3);
    expect(botTake(16)).toBe(1);
    expect(botTake(3)).toBe(3);
  });

  it('the bot never loses from a pile that is not a multiple of 4 when it moves first, whatever the learner does', () => {
    for (let pile = 1; pile <= MAX_PILE; pile++)
      if (pile % 4) expect(botAlwaysWins(pile, true), `pile ${pile}`).toBe(true);
  });

  it('a learner who leaves multiples of 4 always beats the bot from a winning start', () => {
    for (let pile = MIN_PILE; pile <= MAX_PILE; pile++) {
      // The learner wins by moving first when the pile is not a multiple of 4, and by letting the bot start when it is.
      expect(perfectLearnerWins(pile, pile % 4 !== 0), `pile ${pile}`).toBe(true);
    }
  });

  it('draws five pile sizes from 10 to 21, the same for the same seed', () => {
    const piles = drawPiles(seeded(5));
    expect(piles).toHaveLength(GAMES);
    expect(drawPiles(seeded(5))).toEqual(piles);
    const many = Array.from({ length: 200 }, () => drawPiles(seeded(Math.floor(Math.random() * 1e9)))).flat();
    expect(Math.min(...many)).toBe(MIN_PILE);
    expect(Math.max(...many)).toBe(MAX_PILE);
    expect([MIN_PILE, MAX_PILE]).toEqual([10, 21]);
  });

  it('lets the learner always start, let the bot always start, or take turns', () => {
    expect([0, 1, 2].map((g) => starter('you', g))).toEqual(['you', 'you', 'you']);
    expect([0, 1, 2].map((g) => starter('bot', g))).toEqual(['bot', 'bot', 'bot']);
    expect([0, 1, 2, 3].map((g) => starter('alternate', g))).toEqual(['you', 'bot', 'you', 'bot']);
  });

  it("reviews each of the learner's moves: did it leave a multiple of 4, and what would have", () => {
    expect(review(14, 2)).toEqual({ before: 14, take: 2, left: 12, good: true, best: 2 });
    expect(review(14, 1)).toEqual({ before: 14, take: 1, left: 13, good: false, best: 2 });
    // From a multiple of 4 there is no good move: any move leaves the bot a winning one.
    expect(review(12, 3)).toEqual({ before: 12, take: 3, left: 9, good: false, best: undefined });
  });
});
