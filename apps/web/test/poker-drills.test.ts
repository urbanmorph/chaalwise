import { startingScore } from '@chaalwise/poker/bots';
import { deck, type Card } from '@chaalwise/poker/cards';
import { CATEGORIES, evaluate, type Category } from '@chaalwise/poker/evaluate';
import { equity } from '@chaalwise/poker/odds';
import { seeded } from '@chaalwise/poker/random';
import { describe, expect, it } from 'vitest';
import { trackOf, DRILL_SKILL } from '../src/lib/profile-skills';
import { POKER_DRILLS } from '../src/lib/drill-list';
import {
  EQUITY_BANDS,
  POKER_DRILL_KINDS,
  PREFLOP_SEATS,
  pokerDailyItem,
  pokerItem,
  type PokerItem,
} from '../src/lib/poker/drills';

const level = (category: Category) => CATEGORIES.indexOf(category);
const items = (kind: PokerItem['kind'], n: number, seed = 1) => {
  const random = seeded(seed);
  return Array.from({ length: n }, () => pokerItem(kind, random));
};
const known = (item: PokerItem) => [...(item.cards.hole ?? []), ...(item.cards.board ?? [])] as Card[];
const unseen = (item: PokerItem) => deck().filter((card) => !known(item).includes(card));

/** Counted card by card, without the engine's outs: the unseen cards that lift the hand to a flush or a straight. */
function bruteOuts(hole: Card[], board: Card[], drawing: string): number {
  const all = [...hole, ...board];
  const now = level(evaluate(all).category);
  const wanted = (category: Category) =>
    (drawing.includes('flush') && (category === 'flush' || category === 'straight-flush')) ||
    (drawing.includes('straight') && category === 'straight');
  return deck()
    .filter((card) => !all.includes(card))
    .filter((card) => {
      const after = evaluate([...all, card]).category;
      if (level(after) <= now || !wanted(after)) return false;
      // A flush or straight on the shared cards alone is everyone's, so it is no out.
      return board.length !== 4 || level(evaluate([...board, card]).category) < level(after);
    }).length;
}

describe('poker drills: every answer is worked out by the engine', () => {
  it('make the same exercise from the same seed', () => {
    for (const kind of POKER_DRILL_KINDS) {
      if (kind === 'equity') continue; // slow; covered below
      expect(items(kind, 3, 7)).toEqual(items(kind, 3, 7));
      expect(items(kind, 3, 7)).not.toEqual(items(kind, 3, 8));
    }
  });

  it('name poker in every question, explain the jargon, and say points, never chips or money', { timeout: 60_000 }, () => {
    for (const kind of POKER_DRILL_KINDS) {
      for (const item of items(kind, kind === 'equity' ? 2 : 10)) {
        expect(item.prompt, kind).toMatch(/\bpoker\b/);
        expect(`${item.prompt} ${item.explanation}`, kind).not.toMatch(/\bchips?\b|\bcash\b|money|₹|\$/i);
        expect(item.explanation.length, kind).toBeGreaterThan(20);
        if (item.options) expect(item.answer).toBeLessThan(item.options.length);
      }
    }
    expect(items('outs', 1)[0]!.prompt).toMatch(/an out is an unseen card/i);
    expect(items('nuts', 1)[0]!.prompt).toMatch(/the nuts/);
    expect(items('equity', 1)[0]!.prompt).toMatch(/equity/);
  });

  it('count the outs: the answer is every unseen card that makes the stated hand', () => {
    for (const item of items('outs', 30)) {
      const drawing = item.prompt.match(/outs do you have to (a flush or a straight|a flush|a straight)/)![1]!;
      expect(item.options).toBeUndefined();
      expect(item.answer).toBe(bruteOuts(item.cards.hole as Card[], item.cards.board as Card[], drawing));
      expect(item.answer).toBeGreaterThan(0);
      expect(item.explanation).toMatch(new RegExp(`^${item.answer} outs?`));
      // Nothing it asks about is made already.
      expect(level(evaluate(known(item)).category)).toBeLessThan(level('straight'));
    }
  });

  it('pot odds: call when the chance beats the price, worked out from the pot, the call and the outs', () => {
    let withCards = 0;
    for (const item of items('pot-odds', 40)) {
      const { pot, toCall } = item.cards as { pot: number; toCall: number };
      const price = (100 * toCall) / (pot + toCall);
      let chance: number;
      if (item.cards.hole) {
        withCards++;
        const drawing = item.prompt.match(/give you (a flush or a straight|a flush|a straight)/)![1]!;
        const outs = bruteOuts(item.cards.hole as Card[], item.cards.board as Card[], drawing);
        expect(item.prompt).toContain(`${outs} unseen cards`);
        chance = (100 * outs) / unseen(item).length;
      } else chance = Number(item.prompt.match(/about (\d+)% of the time/)![1]);
      expect(item.options).toEqual(['Call', 'Fold']);
      expect(item.options![item.answer]).toBe(chance > price ? 'Call' : 'Fold');
      // Never a coin flip: the chance and the price are clearly apart.
      expect(Math.abs(chance - price)).toBeGreaterThanOrEqual(4);
      expect(item.explanation).toContain(`${Math.round(price)}%`);
    }
    expect(withCards).toBeGreaterThan(5);
  });

  it('the nuts: the answer is the best hand any two unseen cards make with the board', () => {
    for (const item of items('nuts', 8)) {
      const board = item.cards.board as Card[];
      expect(board).toHaveLength(5);
      expect(item.cards.hole).toBeUndefined();
      const rest = deck().filter((card) => !board.includes(card));
      let best = evaluate(board);
      for (let i = 0; i < rest.length; i++)
        for (let j = i + 1; j < rest.length; j++) {
          const hand = evaluate([rest[i]!, rest[j]!, ...board]);
          if (hand.score > best.score) best = hand;
        }
      const label = (name: string) => name[0]!.toUpperCase() + name.slice(1);
      expect(item.options![item.answer]).toBe(label(best.name));
      expect(new Set(item.options).size).toBe(item.options!.length);
      expect(item.options!.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('preflop: play or fold by the starting-hand count, tighter at a full table than heads-up', () => {
    for (const item of items('preflop', 40)) {
      const seat = PREFLOP_SEATS.find((s) => item.prompt.includes(s.label))!;
      expect(seat, item.prompt).toBeDefined();
      const score = startingScore(item.cards.hole as Card[]);
      expect(item.options).toEqual(['Play', 'Fold']);
      expect(item.options![item.answer]).toBe(score >= seat.play ? 'Play' : 'Fold');
      expect(item.explanation).toContain(`scores ${score}`);
    }
    // As the starting-hands lesson says: at a full table most hands fold; heads-up most are played, the weakest still fold.
    const hands = deck().flatMap((a, i) =>
      deck()
        .slice(i + 1)
        .map((b) => [a, b]),
    );
    const share = (min: number) => hands.filter((h) => startingScore(h) >= min).length / hands.length;
    for (const seat of PREFLOP_SEATS) {
      if (seat.id === 'heads-up') {
        expect(share(seat.play)).toBeGreaterThan(0.5);
        expect(share(seat.play)).toBeLessThan(0.9);
      } else expect(share(seat.play)).toBeLessThan(0.35);
    }
  });

  it('guess your chance: the band holds the true equity, checked again independently', { timeout: 60_000 }, () => {
    for (const item of items('equity', 4, 3)) {
      const hole = item.cards.hole as Card[];
      const board = item.cards.board as Card[];
      const figure = Number(item.explanation.match(/(\d+)%/)![1]);
      const check = equity(hole, board, { random: seeded(99), samples: 20_000 }).share;
      expect(Math.abs(check - figure), item.explanation).toBeLessThan(board.length === 5 ? 1 : 3);
      const band = EQUITY_BANDS[item.answer]!;
      expect(check).toBeGreaterThanOrEqual(band.from);
      expect(check).toBeLessThanOrEqual(band.to);
      expect(item.options).toEqual(EQUITY_BANDS.map((b) => b.label));
    }
  });
});

describe("today's poker exercise", () => {
  it('is the same all day, for everyone, and rotates through the drills', () => {
    expect(pokerDailyItem('2026-10-22')).toEqual(pokerDailyItem('2026-10-22'));
    const kinds = ['2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24'].map(
      (date) => pokerDailyItem(date).kind,
    );
    expect(new Set(kinds)).toEqual(new Set(POKER_DRILL_KINDS));
    expect(pokerDailyItem('2026-10-25').kind).toBe(kinds[0]);
    expect(pokerDailyItem('2026-10-25')).not.toEqual(pokerDailyItem('2026-10-20'));
  });

  it('refuses a date that is not YYYY-MM-DD', () => {
    expect(() => pokerDailyItem('22/10/2026')).toThrow();
    expect(() => pokerDailyItem('2026-13-40')).toThrow();
  });
});

describe('the poker drills in the skill profile and the list of drills', () => {
  it('give evidence for the strategy track each trains', () => {
    const track = (kind: string) => trackOf(DRILL_SKILL[`poker-${kind}`]);
    expect(['outs', 'pot-odds', 'equity'].map(track)).toEqual(['weigh-odds', 'weigh-odds', 'weigh-odds']);
    expect(track('nuts')).toBe('read-hidden');
    expect(track('preflop')).toBe('size-risk');
  });

  it('list every kind once, each with its own anchor', () => {
    expect(POKER_DRILLS.map((d) => d.kind).sort()).toEqual([...POKER_DRILL_KINDS].sort());
    expect(new Set(POKER_DRILLS.map((d) => d.id)).size).toBe(POKER_DRILLS.length);
    for (const drill of POKER_DRILLS) expect(drill.summary, drill.id).toMatch(/\bpoker\b/i);
  });
});
