import type { Random } from './seeded';

/**
 * Who backs down?: hawk-dove (Maynard Smith and Price 1973), also called chicken. Two sweet shops face each other
 * across a market lane. Each week each chooses to push (cut prices and fight for every customer) or give way (keep
 * prices and share the lane). Pushing against one who gives way wins the prize; both pushing is a price war that
 * costs both more than the prize is worth. Against four rivals with different habits, then a debrief on the mix
 * that balances, what a name for never backing down is worth, and brinkmanship (Schelling 1960). The numbers are
 * this lab's design.
 */

export type Move = 'push' | 'give';

/** What the week's customers are worth, and what a price war costs whoever loses it. */
export const PRIZE = 10;
export const FIGHT = 30;

/** Your points for a week, given your move and theirs. */
export function payoff(mine: Move, theirs: Move): number {
  if (mine === 'push') return theirs === 'give' ? PRIZE : (PRIZE - FIGHT) / 2;
  return theirs === 'give' ? PRIZE / 2 : 0;
}

/** The share of weeks a rival pushes at which pushing and giving way pay you the same. */
export const BALANCE = PRIZE / FIGHT;

/** Your average points a week for a move, against a rival who pushes this share of weeks. */
export const expected = (mine: Move, pushes: number): number =>
  pushes * payoff(mine, 'push') + (1 - pushes) * payoff(mine, 'give');

export const WEEKS = 5;

export const everyWeek = (move: Move): Move[] => Array<Move>(WEEKS).fill(move);

export type RivalId = 'meena' | 'ramesh' | 'gopal' | 'salim';

export interface Rival {
  id: RivalId;
  name: string;
  /** What you know before you play; completes a sentence that starts with the name. */
  hint: string;
  /** Their rule, revealed in the debrief; completes a sentence that starts with the name. */
  rule: string;
}

export const RIVALS: Rival[] = [
  { id: 'meena', name: 'Meena', hint: 'likes a quiet life.', rule: 'gives way every week.' },
  {
    id: 'ramesh',
    name: 'Ramesh',
    hint: 'has told the whole market that he never backs down.',
    rule: 'pushes every week, whatever it costs him.',
  },
  {
    id: 'gopal',
    name: 'Gopal',
    hint: 'watches what you did last week.',
    rule: 'gives way at first, then pushes after a week you gave way, and gives way after a week you pushed.',
  },
  { id: 'salim', name: 'Salim', hint: 'is hard to read.', rule: 'pushes one week in three, at random.' },
];

/** A rival's move this week, from your moves against them so far. */
export function rivalMove(id: RivalId, yours: readonly Move[], random: Random): Move {
  switch (id) {
    case 'meena':
      return 'give';
    case 'ramesh':
      return 'push';
    case 'gopal':
      return yours.at(-1) === 'give' ? 'push' : 'give';
    case 'salim':
      return random() < BALANCE ? 'push' : 'give';
  }
}

/** Your moves against a rival, with theirs and your points. Salim's moves may be given, to replay the weeks played. */
export function playRival(id: RivalId, yours: readonly Move[], random: Random, theirs?: readonly Move[]) {
  const them = yours.map((_, i) => theirs?.[i] ?? rivalMove(id, yours.slice(0, i), random));
  return { them, points: yours.reduce((s, m, i) => s + payoff(m, them[i]!), 0) };
}

/** Every plan of moves for the weeks against one rival. */
const plans = (): Move[][] =>
  Array.from({ length: 2 ** WEEKS }, (_, n) => everyWeek('give').map((_, i) => ((n >> i) & 1 ? 'push' : 'give')));

/** The plan that scores most against a rival whose rule does not depend on chance (the first, if two tie). */
export function bestPlan(id: Exclude<RivalId, 'salim'>): { moves: Move[]; points: number } {
  const never: Random = () => 0;
  return plans()
    .map((moves) => ({ moves, points: playRival(id, moves, never).points }))
    .reduce((best, p) => (p.points > best.points ? p : best));
}

/** In a stand-off where each week carries a 1 in 10 chance that it blows up for both, the chance it has after this many weeks. */
export const RISK = 0.1;
export const blowUpChance = (weeks: number): number => 1 - (1 - RISK) ** weeks;
