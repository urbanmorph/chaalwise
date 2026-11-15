/**
 * The shared fund: a public goods game (the tragedy of the commons, Hardin 1968). You and four neighbours in a
 * housing society each have 10 points a month and choose how many to put into the maintenance fund. The fund is
 * doubled and shared equally among the five, so each point you put in brings you back 0.4: keeping it always pays
 * you more, yet if all put in everything, all end with twice as much as if nobody does.
 *
 * Part 1 posts only the fund's total. The neighbours are conditional cooperators who match last month's average
 * (one of them a little short, as Fischbacher, Gächter and Fehr 2001 found most do), a free rider and a steady
 * giver, so what goes in falls month by month. Part 2 posts everyone's amount on the notice board, and anyone may
 * fine a neighbour, at a cost to themselves (Fehr and Gächter 2000); the society's rule is at least 5. What goes in
 * holds up. The numbers are this lab's design.
 */

/** Points each member has a month, and the members: you and four neighbours. */
export const ENDOWMENT = 10;
export const PEOPLE = 5;
/** What the fund is multiplied by before it is shared. */
export const GROWTH = 2;
/** Months in each part. */
export const MONTHS = 6;
/** A fine costs the one who gives it 1 point and the one fined 3. */
export const FINE_COST = 1;
export const FINE_HIT = 3;
/** The society's rule on the notice board: put in at least this much, or risk a fine. */
export const BOARD_RULE = 5;
/** What a neighbour puts in more, from then on, for each fine it has had. */
export const PER_FINE = 2;

/** Part 1 posts only the total; part 2 posts every amount on the notice board. */
export type PartId = 'plain' | 'board';

export type NeighbourId = 'rakesh' | 'anita' | 'dev' | 'lakshmi';

export interface Neighbour {
  id: NeighbourId;
  name: string;
  /** What they put in on the first month of each part. */
  first: number;
  /** Their habit, revealed in the debrief; completes a sentence that starts with the name. */
  habit: string;
  /** Whether they fine anyone under the rule, once the notice board is up. */
  fines: boolean;
}

/** The neighbours, in the order of the members after you (member 1 to 4). */
export const NEIGHBOURS: Neighbour[] = [
  {
    id: 'rakesh',
    name: 'Rakesh',
    first: 0,
    habit: 'puts in nothing, and enjoys the clean stairs all the same.',
    fines: false,
  },
  { id: 'anita', name: 'Anita', first: 8, habit: 'puts in what the average member put in last month.', fines: true },
  {
    id: 'dev',
    name: 'Dev',
    first: 8,
    habit: 'puts in what the average member put in last month, less 1, unless his amount is on the board.',
    fines: false,
  },
  { id: 'lakshmi', name: 'Lakshmi', first: 6, habit: 'puts in 6 every month, whatever the others do.', fines: true },
];

/** A fine, from one member to another: 0 is you, 1 to 4 the neighbours. */
export interface Fine {
  from: number;
  to: number;
}

export interface Month {
  /** What each member put in: you first, then the neighbours. */
  put: number[];
  fines: Fine[];
  /** What each member ended the month with. */
  points: number[];
}

/** Each member's share of a fund with this much put in: doubled, then shared by all five. */
export const fundShare = (total: number): number => (total * GROWTH) / PEOPLE;

const sum = (xs: readonly number[]) => xs.reduce((s, x) => s + x, 0);

/** What each member ends a month with: what they kept, their share of the fund, less fines given and received. */
export function roundPoints(put: readonly number[], fines: readonly Fine[]): number[] {
  const share = fundShare(sum(put));
  return put.map(
    (c, i) =>
      ENDOWMENT -
      c +
      share -
      FINE_COST * fines.filter((f) => f.from === i).length -
      FINE_HIT * fines.filter((f) => f.to === i).length,
  );
}

/** What the neighbours put in this month, from the months of this part so far. */
function neighboursPut(part: PartId, history: readonly Month[]): number[] {
  const last = history.at(-1);
  const average = last ? Math.round(sum(last.put) / PEOPLE) : 0;
  return NEIGHBOURS.map((n, k) => {
    const fined = history.reduce((s, m) => s + m.fines.filter((f) => f.to === k + 1).length, 0);
    const habit =
      !last || n.id === 'rakesh' || n.id === 'lakshmi'
        ? n.first
        : n.id === 'dev' && part === 'plain'
          ? Math.max(0, average - 1)
          : average;
    return Math.min(ENDOWMENT, habit + PER_FINE * fined);
  });
}

/** The fines the neighbours give: on the notice board, those who fine fine anyone under the rule but themselves. */
export const botFines = (part: PartId, put: readonly number[]): Fine[] =>
  part === 'plain'
    ? []
    : NEIGHBOURS.flatMap((n, k) =>
        n.fines ? put.flatMap((c, to) => (c < BOARD_RULE && to !== k + 1 ? [{ from: k + 1, to }] : [])) : [],
      );

/** One month: your amount and fines with the neighbours' amounts and fines, and what each member ends with. */
export function playMonth(part: PartId, history: readonly Month[], yours: number, yourFines: readonly number[]): Month {
  const put = [yours, ...neighboursPut(part, history)];
  const fines = [...(part === 'board' ? yourFines.map((to) => ({ from: 0, to })) : []), ...botFines(part, put)];
  return { put, fines, points: roundPoints(put, fines) };
}

/** A whole part: `yours` chooses what you put in, and `yourFines` whom you fine once the amounts are up. */
export function playPart(
  part: PartId,
  yours: (history: readonly Month[]) => number,
  yourFines: (month: { put: number[] }) => number[],
): Month[] {
  const months: Month[] = [];
  for (let i = 0; i < MONTHS; i++) {
    const put = yours(months);
    const before = playMonth(part, months, put, []);
    months.push(playMonth(part, months, put, yourFines(before)));
  }
  return months;
}

/** Each member's points over the months. */
export const standings = (months: readonly Month[]): number[] =>
  months.reduce((s, m) => s.map((x, i) => x + m.points[i]!), Array<number>(PEOPLE).fill(0));

/** What the neighbours put in, in all, in a month. */
export const neighboursTotal = (m: Month): number => sum(m.put.slice(1));

/** On the board, putting in 0 instead of the rule's 5: the points it keeps, after what the 5 would have brought back. */
export const holdBackGain = (): number => BOARD_RULE - fundShare(BOARD_RULE);

/** What putting in under the rule costs in fines on the board: one from each neighbour who fines. */
export const holdBackFines = (): number => NEIGHBOURS.filter((n) => n.fines).length * FINE_HIT;
