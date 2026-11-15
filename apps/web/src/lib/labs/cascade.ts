import { seeded, type Random } from './seeded';

/**
 * Follow the queue?: an information cascade (Bikhchandani, Hirshleifer and Welch 1992; Banerjee 1992), as in Anderson
 * and Holt's classroom version (1997). Two restaurants open side by side; one is better. Each person on the street has
 * a friend's tip, right 2 times in 3, and sees where the people before them went. Each counts the tips the earlier
 * choices show and adds their own: once one door leads by two tips, their own tip cannot outweigh the queue, so they
 * follow it, and their choice shows nothing more. From then on the queue is locked, right or wrong. The street and its
 * numbers are this lab's design.
 */

export type Door = 'blue' | 'green';

export const DOOR_NAME: Record<Door, string> = { blue: 'Blue Door', green: 'Green Door' };

export const other = (d: Door): Door => (d === 'blue' ? 'green' : 'blue');

/** How often a tip names the better restaurant. */
export const TIP_RIGHT = 2 / 3;
/** How often the first two tips are both wrong, in a fair draw. */
export const BOTH_WRONG = (1 - TIP_RIGHT) ** 2;
/** People on a street, the people ahead of you, and the friends you may ask. */
export const STREET = 12;
export const AHEAD = 5;
export const FRIENDS = 4;

export type PartId = 'queue' | 'ask';

/** Six streets: three reading the queue, then three where you may ask why and ask four friends; one of each picked to start wrong. */
export const ROUNDS: { part: PartId; rigged: boolean }[] = [
  { part: 'queue', rigged: false },
  { part: 'queue', rigged: true },
  { part: 'queue', rigged: false },
  { part: 'ask', rigged: false },
  { part: 'ask', rigged: true },
  { part: 'ask', rigged: false },
];

const tipFor = (better: Door, random: Random): Door => (random() < TIP_RIGHT ? better : other(better));

/** The door a lead in shown tips is locked on: Blue Door at +2 or more, Green Door at -2 or less. */
export const lockedOn = (lead: number): Door | undefined => (lead >= 2 ? 'blue' : lead <= -2 ? 'green' : undefined);

const vote = (d: Door) => (d === 'blue' ? 1 : -1);

/** Reading the queue: follow it once it is locked, otherwise your own tip (it decides a tie, too). */
export const readQueue = (lead: number, tip: Door): Door => lockedOn(lead) ?? tip;

/** What those behind learn from a choice: a tip, if the queue was not yet locked; nothing, if it was. */
const learn = (lead: number, choice: Door) => (lockedOn(lead) ? lead : lead + vote(choice));

export interface Person {
  tip: Door;
  choice: Door;
  /** Whether the choice showed the tip: it was made before the queue locked. */
  showed: boolean;
  you?: boolean;
}

/** People choosing in turn, each reading the queue; and the lead in shown tips after them (Blue Door's, less Green Door's). */
export function walk(tips: readonly Door[], start = 0): { people: Person[]; lead: number } {
  let lead = start;
  const people = tips.map((tip) => {
    const choice = readQueue(lead, tip);
    const person = { tip, choice, showed: !lockedOn(lead) };
    lead = learn(lead, choice);
    return person;
  });
  return { people, lead };
}

export interface Street {
  better: Door;
  /** Everyone's tips in order; yours is at AHEAD. */
  tips: Door[];
  /** Tips from friends who have not seen the queue. */
  friends: Door[];
  /** Picked to start wrong: the first two tips wrong, yours right. */
  rigged: boolean;
}

export function drawStreet(random: Random, rigged = false): Street {
  const better: Door = random() < 0.5 ? 'blue' : 'green';
  const tips = Array.from({ length: STREET }, () => tipFor(better, random));
  if (rigged) [tips[0], tips[1], tips[AHEAD]] = [other(better), other(better), better];
  return { better, tips, friends: Array.from({ length: FRIENDS }, () => tipFor(better, random)), rigged };
}

/** The tips the queue ahead of you showed: Blue Door's lead. */
const leadAhead = (street: Street): number => walk(street.tips.slice(0, AHEAD)).lead;

/** A whole street with your choice in it; those behind read your choice like anyone's. */
export function runStreet(street: Street, yours: Door) {
  const ahead = walk(street.tips.slice(0, AHEAD));
  const you: Person = { tip: street.tips[AHEAD]!, choice: yours, showed: !lockedOn(ahead.lead), you: true };
  const behind = walk(street.tips.slice(AHEAD + 1), learn(ahead.lead, yours));
  const people = [...ahead.people, you, ...behind.people];
  const lockedAt = people.findIndex((p) => !p.showed);
  return {
    people,
    /** The first person who chose with the queue locked, if anyone did. */
    lockedAt: lockedAt < 0 ? undefined : lockedAt,
    /** The door it locked on. */
    door: lockedAt < 0 ? undefined : people[lockedAt]!.choice,
    /** Where the last person on the street went. */
    ended: people.at(-1)!.choice,
  };
}

export type Run = ReturnType<typeof runStreet>;

/** Counting tips, not people: those the queue showed, then yours and your friends'; a tie goes to your own tip. */
export const countTips = (lead: number, own: Door, friends: readonly Door[]): Door => {
  const sum = lead + vote(own) + friends.reduce((s, f) => s + vote(f), 0);
  return sum > 0 ? 'blue' : sum < 0 ? 'green' : own;
};

/** Over many fair streets, how often each way of choosing picks the worse door, and how often the queue locks before you. */
export function simulate(trials: number, random: Random) {
  const n = { ended: 0, oneTip: 0, pooled: 0, lockedBefore: 0, lockedWrong: 0, youRead: 0, youAsk: 0 };
  for (let i = 0; i < trials; i++) {
    const s = drawStreet(random);
    const wrong = (d: Door | undefined) => (d && d !== s.better ? 1 : 0);
    const lead = leadAhead(s);
    const read = readQueue(lead, s.tips[AHEAD]!);
    const run = runStreet(s, read);
    n.ended += wrong(run.ended);
    n.oneTip += wrong(s.tips[0]);
    // All twelve tips pooled, the majority going; a tie is a coin toss, so half wrong.
    const sum = s.tips.reduce((t, d) => t + vote(d) * vote(s.better), 0);
    n.pooled += sum < 0 ? 1 : sum === 0 ? 0.5 : 0;
    n.lockedBefore += lockedOn(lead) ? 1 : 0;
    n.lockedWrong += wrong(lockedOn(lead));
    n.youRead += wrong(read);
    n.youAsk += wrong(countTips(lead, s.tips[AHEAD]!, s.friends));
  }
  return Object.fromEntries(Object.entries(n).map(([k, v]) => [k, v / trials])) as typeof n;
}

/** Your streets, the other people on them: how many tips pointed to the better door, how many chose it, and the queues that locked before you. */
export function tally(runs: { street: Street; run: Run }[]) {
  const others = runs.flatMap(({ street, run }) =>
    run.people.filter((p) => !p.you).map((p) => ({ p, better: street.better })),
  );
  const early = runs.filter(({ run }) => run.lockedAt !== undefined && run.lockedAt <= AHEAD);
  return {
    people: others.length,
    tipsRight: others.filter(({ p, better }) => p.tip === better).length,
    choseRight: others.filter(({ p, better }) => p.choice === better).length,
    locked: early.length,
    lockedWrong: early.filter(({ street, run }) => run.door !== street.better).length,
  };
}

/** Streets the debrief simulates, always the same ones. */
export const SIMULATED = 10000;
export const debriefSimulation = () => simulate(SIMULATED, seeded(1));
