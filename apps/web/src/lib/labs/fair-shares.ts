/**
 * Fair shares: splitting what three people make together (a coalitional game).
 * A split is in the core (Gillies 1959) if no person or pair would do better on
 * their own. The Shapley value (Shapley 1953) gives each person the average of
 * what they add, over every order in which the three could have joined. For a
 * cab that drops people along one road, it shares each stretch among those who
 * ride it (Littlechild and Owen 1973).
 *
 * The learner proposes splits; a bot objects if it, alone or with one partner,
 * would do better. The numbers are this lab's design, chosen so that the equal
 * split draws an objection and the Shapley split is whole numbers.
 */

/** A group of the three players, as bits: player i is in it if bit i is set. 0b111 is all three. */
export type Group = number;

export interface SplitGame {
  id: 'stall' | 'cab';
  /** A value game shares out points made; a cost game shares out a cost, the fare. */
  kind: 'value' | 'cost';
  title: string;
  /** The setting, in a sentence or two. */
  about: string;
  players: { name: string; role: string }[];
  /** What each group makes (or pays) on its own, by its bits: [_, A, B, AB, C, AC, BC, ABC]. */
  worth: number[];
  /** A player who asks for a share because the others need them, if any. */
  claim?: { who: number; points: number; says: string };
}

export const ALL: Group = 0b111;

/** Proposals the learner may make for each game before the fair split is shown. */
export const TRIES = 3;

export const GAMES: SplitGame[] = [
  {
    id: 'stall',
    kind: 'value',
    title: 'The fest food stall',
    about:
      'Three friends run a food stall at their college fest. Points stand for what the stall makes. On their own, or in pairs, they would make less.',
    players: [
      { name: 'Asha', role: 'cooks the food' },
      { name: 'Bilal', role: 'has booked the stall space' },
      { name: 'Chitra', role: 'brings in customers through the college’s social media page' },
    ],
    // Alone: Asha 12, Bilal 0, Chitra 6. Pairs: Asha and Bilal 72, Asha and Chitra 36, Bilal and Chitra 24. All: 90.
    worth: [0, 12, 0, 72, 6, 36, 24, 90],
    claim: { who: 1, points: 45, says: 'Without the space I booked, there is no stall. I want half: 45.' },
  },
  {
    id: 'cab',
    kind: 'cost',
    title: 'The shared cab',
    about:
      'Three colleagues leave the office late and share one cab home along the same road. Points stand for the fare. A cab costs the fare to the farthest stop of those in it, so the shared cab costs what Farid’s alone would.',
    players: [
      { name: 'Deepa', role: 'gets off first' },
      { name: 'Esha', role: 'gets off second' },
      { name: 'Farid', role: 'gets off last' },
    ],
    // A cab costs the fare to the farthest stop of those in it: 24, 60 or 90.
    worth: [0, 24, 60, 60, 90, 90, 90, 90],
  },
];

/** The players in a group, by number. */
export const members = (s: Group): number[] => [0, 1, 2].filter((i) => s & (1 << i));

export const worth = (g: SplitGame, s: Group): number => g.worth[s]!;

const shareOf = (x: readonly number[], s: Group) => members(s).reduce((sum, i) => sum + x[i]!, 0);

export interface Objection {
  /** The person, or pair, who would do better without the rest. */
  who: number[];
  /** What they would make (or pay) on their own. */
  own: number;
  /** What the split gives them (or asks of them) together. */
  given: number;
}

/** Each person or pair who would do better on their own than with this split: alone first, then pairs. */
export function objections(g: SplitGame, x: readonly number[]): Objection[] {
  const groups = [1, 2, 4, 3, 5, 6];
  return groups.flatMap((s) => {
    const [own, given] = [worth(g, s), shareOf(x, s)];
    const better = g.kind === 'value' ? own > given : own < given;
    return better ? [{ who: members(s), own, given }] : [];
  });
}

/** A split is in the core if it shares out the whole and nobody objects. */
export const inCore = (g: SplitGame, x: readonly number[]): boolean =>
  shareOf(x, ALL) === worth(g, ALL) && objections(g, x).length === 0;

/**
 * Each person's range in the core, [least, most]. With three people, a pair is
 * content exactly when the third gets no more than the whole less what the pair
 * makes alone (in a cost game, pays no less than the whole less the pair's fare).
 */
export function coreRanges(g: SplitGame): [number, number][] {
  const total = worth(g, ALL);
  return [0, 1, 2].map((i) => {
    const [alone, rest] = [worth(g, 1 << i), total - worth(g, ALL ^ (1 << i))];
    return g.kind === 'value' ? [alone, rest] : [rest, alone];
  });
}

/** The six orders in which three people can join. */
export const ORDERS: number[][] = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
];

/** What each person adds (or adds to the cost) on joining, in this order, by player. */
export function addedIn(g: SplitGame, order: readonly number[]): number[] {
  const added = [0, 0, 0];
  let s = 0;
  for (const i of order) {
    added[i] = worth(g, s | (1 << i)) - worth(g, s);
    s |= 1 << i;
  }
  return added;
}

/** The Shapley split: each person's average of what they add, over the six orders. */
export const shapley = (g: SplitGame): number[] =>
  [0, 1, 2].map((i) => ORDERS.reduce((sum, order) => sum + addedIn(g, order)[i]!, 0) / ORDERS.length);

/** The same share for everyone. */
export const equalSplit = (g: SplitGame): number[] => [0, 1, 2].map(() => worth(g, ALL) / 3);
