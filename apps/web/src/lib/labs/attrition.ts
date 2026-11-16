import { between, type Random } from './seeded';

/**
 * Wait them out?: a war of attrition (Maynard Smith 1974). You and a neighbour both want the secretary's post in a
 * housing society, and whoever is left when the other withdraws takes it. Each week both stay in costs each of you;
 * the one who withdraws has paid too. Against four rivals with hidden stop points, then a debrief on keeping to a stop
 * point set beforehand, a rival whose mix leaves every plan at 0 on average (the mixed equilibrium, Bishop and
 * Cannings 1978), how often two such rivals pay more than the post, and which signals of staying power to believe.
 * The numbers and the rivals' habits are this lab's design.
 */

export type Move = 'stay' | 'withdraw';
export type Result = 'won' | 'lost' | 'neither';

/** What the post is worth to whoever gets it, and what each week both stay in costs each side. */
export const POST = 10;
export const WEEK = 1;

/** The stop points a learner can set before a contest: at most this many weeks in. */
export const STOPS = [0, 2, 5, 10, 20];

/** The chance a week that leaves you no better off staying in than withdrawing: 1 in 11. */
export const QUIT = WEEK / (POST + WEEK);

/** A week of a contest, given your move and how many weeks the rival stays in: still on, or settled. */
export function week(n: number, you: Move, stop: number): 'on' | Result {
  const theyStay = n <= stop;
  if (you === 'stay') return theyStay ? 'on' : 'won';
  return theyStay ? 'lost' : 'neither';
}

/** Your points for a contest: the post if you got it, less a week's cost for every week both stayed in. */
export const points = (result: Result, weeks: number): number => (result === 'won' ? POST : 0) - weeks * WEEK;

/** Staying in at most `plan` weeks against a rival who stays in `stop` weeks. */
export function playPlan(plan: number, stop: number) {
  const weeks = Math.min(plan, stop);
  const result: Result = plan > stop ? 'won' : plan < stop ? 'lost' : 'neither';
  return { result, weeks, points: points(result, weeks) };
}

/** The most you could score knowing their stop point: outlast them if it costs less than the post, else withdraw at once. */
export const bestKnowing = (stop: number): number => Math.max(points('won', stop), 0);

export type RivalId = 'bina' | 'arjun' | 'farah' | 'kavya';

export interface Rival {
  id: RivalId;
  name: string;
  /** What you know before you play; completes a sentence that starts with the name. */
  hint: string;
  /** Their habit, revealed in the debrief; completes a sentence that starts with the name. */
  rule: string;
}

export const RIVALS: Rival[] = [
  {
    id: 'bina',
    name: 'Bina',
    hint: 'has just started a new job and has few evenings free.',
    rule: 'stays in 0 to 2 weeks.',
  },
  {
    id: 'arjun',
    name: 'Arjun',
    hint: 'has told the whole society that he will never withdraw.',
    rule: 'stays in 2 to 4 weeks: saying it cost him nothing.',
  },
  {
    id: 'farah',
    name: 'Farah',
    hint: 'has already printed and paid for notices for twenty weeks of visits.',
    rule: 'stays in 15 to 20 weeks: she paid up front, which made sense only if she meant to stay.',
  },
  {
    id: 'kavya',
    name: 'Kavya',
    hint: 'is hard to read.',
    rule: 'withdraws in any week with a chance of 1 in 11, however long she has stayed in.',
  },
];

/** How many weeks a rival stays in before withdrawing, drawn afresh for each contest. */
export function drawStop(id: RivalId, random: Random): number {
  switch (id) {
    case 'bina':
      return between(0, 2, random);
    case 'arjun':
      return between(2, 4, random);
    case 'farah':
      return between(15, 20, random);
    case 'kavya': {
      let weeks = 0;
      while (random() >= QUIT) weeks += 1;
      return weeks;
    }
  }
}

/** Your average points against Kavya when you stay in at most `plan` weeks: 0 for every plan. */
export function expectedAgainstBalance(plan: number): number {
  const stays = 1 - QUIT;
  let sum = stays ** plan * points('lost', plan); // she outlasts the plan (or withdraws the week you do: the same points)
  for (let n = 1; n <= plan; n++) sum += stays ** (n - 1) * QUIT * points('won', n - 1);
  return sum;
}

/**
 * Two people who both stay in like Kavya. A week both stay in has the chance `both`. On average each pays `weeks`;
 * someone gets the post `won` of the time; `overPost` of contests cost more between them than the post is worth, and
 * `eachOver` cost each side alone more than that.
 */
const both = (1 - QUIT) ** 2;
export const pair = {
  weeks: both / (1 - both),
  won: (2 * QUIT * (1 - QUIT)) / (1 - both),
  overPost: both ** (Math.floor(POST / (2 * WEEK)) + 1),
  eachOver: both ** (Math.floor(POST / WEEK) + 1),
};
