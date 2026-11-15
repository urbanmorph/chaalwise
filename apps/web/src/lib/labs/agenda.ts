/**
 * Who sets the agenda? Majority votes can cycle (Condorcet 1785), so the order of
 * pairwise votes can decide the winner (McKelvey 1976; Riker 1986). A college fest
 * committee of three groups chooses the main event. Each group ranks the three
 * options differently, so each option loses to another by a majority.
 *
 * Votes run as committees often run them: two options face each other first,
 * then the winner faces the option held back. First the learner chairs and sets
 * the order; then the learner speaks for one group while bot chairs set it, and
 * may vote for a second choice in the first vote to stop a worse result in the
 * last (strategic voting; Farquharson 1969). The rankings are this lab's design.
 */

export type Option = 'band' | 'comedy' | 'dance';

export const OPTIONS: Option[] = ['band', 'comedy', 'dance'];

/** Each option, as it reads in a sentence. */
export const NAME: Record<Option, string> = {
  band: 'a band night',
  comedy: 'a comedy show',
  dance: 'a dance contest',
};

/** Each option, as a label on its own. */
export const LABEL: Record<Option, string> = { band: 'Band night', comedy: 'Comedy show', dance: 'Dance contest' };

export interface Group {
  id: 'final-years' | 'hostel' | 'day-scholars';
  name: string;
  /** Why they rank as they do, completing a sentence that starts with the name. */
  about: string;
  size: number;
  /** Most liked first. */
  ranking: [Option, Option, Option];
}

export const GROUPS: Group[] = [
  {
    id: 'final-years',
    name: 'The final-years',
    about: 'want a big last fest: a band first, comedy next, a dance contest last.',
    size: 4,
    ranking: ['band', 'comedy', 'dance'],
  },
  {
    id: 'hostel',
    name: 'The hostel students',
    about: 'want something everyone can watch: comedy first, then dance, a band last.',
    size: 4,
    ranking: ['comedy', 'dance', 'band'],
  },
  {
    id: 'day-scholars',
    name: 'The day scholars',
    about: 'want to take part, not only watch: a dance contest first, then a band, comedy last.',
    size: 4,
    ranking: ['dance', 'band', 'comedy'],
  },
];

/** The group the learner speaks for in the second part. */
export const YOUR_GROUP: Group['id'] = 'day-scholars';
const yours = GROUPS.find((g) => g.id === YOUR_GROUP)!;

const likes = (g: Group, x: Option, y: Option) => g.ranking.indexOf(x) < g.ranking.indexOf(y);

/** Where an option comes in your group's ranking: 1, 2 or 3. */
export const place = (o: Option): number => yours.ranking.indexOf(o) + 1;

/** A sincere vote between two options: for the one your group likes more. */
export const sincere = ([x, y]: readonly [Option, Option]): Option => (likes(yours, x, y) ? x : y);

/** Votes for each of two options, with every group voting sincerely unless `yourVote` says how your group votes. */
export function tally(x: Option, y: Option, yourVote?: Option): Partial<Record<Option, number>> {
  const count = { [x]: 0, [y]: 0 } as Record<Option, number>;
  for (const g of GROUPS) {
    const vote = g.id === YOUR_GROUP && yourVote ? yourVote : likes(g, x, y) ? x : y;
    count[vote] += g.size;
  }
  return count;
}

/** Whether a majority prefers x to y when everyone votes sincerely. */
export const beats = (x: Option, y: Option): boolean => tally(x, y)[x]! > tally(x, y)[y]!;

/** An option that beats each of the others in a straight vote, if there is one. */
export const condorcetWinner = (): Option | undefined =>
  OPTIONS.find((x) => OPTIONS.every((y) => y === x || beats(x, y)));

/** Each straight vote's winner, loser and votes, in the circle they make: band over comedy, comedy over dance, dance over band. */
export function majorities(): { winner: Option; loser: Option; votes: number; against: number }[] {
  const circle: [Option, Option][] = [];
  for (let x = OPTIONS[0]!; circle.length < OPTIONS.length;) {
    const y = OPTIONS.find((o) => o !== x && beats(x, o))!;
    circle.push([x, y]);
    x = y;
  }
  return circle.map(([winner, loser]) => {
    const count = tally(winner, loser);
    return { winner, loser, votes: count[winner]!, against: count[loser]! };
  });
}

/** The two options voted on first, when `held` is held back to the last vote. */
export const firstPair = (held: Option): [Option, Option] => OPTIONS.filter((o) => o !== held) as [Option, Option];

export interface Vote {
  pair: [Option, Option];
  count: Partial<Record<Option, number>>;
  winner: Option;
}

/** How your group votes in the first and the last vote; a vote left out, or not on the ballot, is sincere. */
export interface YourVotes {
  first?: Option;
  last?: Option;
}

/** Two votes: the first pair, then its winner against the option held back. */
export function runAgenda(held: Option, mine: YourVotes = {}): { votes: Vote[]; winner: Option } {
  const vote = (pair: [Option, Option], yours?: Option): Vote => {
    const count = tally(...pair, yours && pair.includes(yours) ? yours : undefined);
    return { pair, count, winner: count[pair[0]]! > count[pair[1]]! ? pair[0] : pair[1] };
  };
  const first = vote(firstPair(held), mine.first);
  const last = vote([first.winner, held], mine.last);
  return { votes: [first, last], winner: last.winner };
}

/** The option to hold back so that `target` wins when everyone votes sincerely. */
export const orderFor = (target: Option): Option => OPTIONS.find((held) => runAgenda(held).winner === target)!;

/** What each first vote of yours leads to, voting sincerely in the last. */
export const voteOptions = (held: Option): { first: Option; winner: Option }[] =>
  firstPair(held).map((first) => ({ first, winner: runAgenda(held, { first }).winner }));

/** Where a sincere first vote leads, and a first vote that leads somewhere better for your group, if there is one. */
export function lookAhead(held: Option): {
  sincere: { first: Option; winner: Option };
  better?: { first: Option; winner: Option };
} {
  const options = voteOptions(held);
  const honest = options.find((o) => o.first === sincere(firstPair(held)))!;
  const better = options.find((o) => place(o.winner) < place(honest.winner));
  return better ? { sincere: honest, better } : { sincere: honest };
}

/** The first part: you chair three meetings, each time asked for a different winner. */
export interface ChairMeeting {
  /** Who asks, as a sentence's subject. */
  who: string;
  wants: Option;
  /** Why they ask, completing "… because". */
  why: string;
}

export const CHAIR_MEETINGS: ChairMeeting[] = [
  { who: 'The principal', wants: 'band', why: 'a band night would bring in the most visitors from other colleges' },
  { who: 'The treasurer', wants: 'comedy', why: 'a comedy show costs the least to put on' },
  { who: 'The sports secretary', wants: 'dance', why: 'a dance contest gets the most students taking part' },
];

/** The second part: a bot chair sets the order to get its favourite, expecting sincere votes. */
export interface MemberMeeting {
  chair: string;
  /** Who the chair is, after the name. */
  who: string;
  favourite: Option;
  /** The option the chair holds back to the last vote. */
  held: Option;
}

export const MEMBER_MEETINGS: MemberMeeting[] = [
  { chair: 'Kiran', who: 'a hostel student', favourite: 'comedy', held: orderFor('comedy') },
  { chair: 'Rhea', who: 'a final-year', favourite: 'band', held: orderFor('band') },
];
