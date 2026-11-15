import { between, seeded, shuffle, type Random } from './seeded';

/**
 * Guess two-thirds, the beauty contest (Keynes 1936, ch. 12; Nagel 1995): everyone picks a whole number from 0 to 100,
 * and the winner is closest to two-thirds of the average. The bots think to different depths, as in level-k models
 * (Nagel 1995; Camerer, Ho and Chong 2004): level 0 picks at random, averaging 50; level 1 expects level 0 and picks
 * two-thirds of 50; each further step takes two-thirds again. All the way down, the "rational" answer is 0. The crowds'
 * mixes are this lab's design.
 */

export const FRACTION = 2 / 3;
/** Bots in each crowd; you make the twelfth. */
export const BOTS = 11;
/** How far a bot that thinks ahead strays from its step's number, either way. */
const STRAY = 3;

/** The depths the debrief compares: none, one, two and three steps, and all the way. */
export const DEPTHS = [0, 1, 2, 3, Infinity];

/** The number a k-step thinker aims at: 50 at no steps, two-thirds of the step before after each, 0 all the way. */
export const stepGuess = (k: number): number => (Number.isFinite(k) ? 50 * FRACTION ** k : 0);

/** A depth in words: "no steps", "1 step", "all the way". */
export const depthName = (k: number): string =>
  !Number.isFinite(k) ? 'all the way' : k === 0 ? 'no steps' : `${k} ${k === 1 ? 'step' : 'steps'}`;

/** A bot's guess: level 0 at random from 0 to 100; deeper ones near their step's number; all the way, 0. */
export const botGuess = (k: number, random: Random): number =>
  k === 0 ? between(0, 100, random) : Number.isFinite(k) ? Math.round(stepGuess(k) + (random() * 2 - 1) * STRAY) : 0;

/** The depth whose number is nearest a guess (or a target). */
export const depthOf = (x: number): number =>
  DEPTHS.reduce((best, k) => (Math.abs(x - stepGuess(k)) < Math.abs(x - stepGuess(best)) ? k : best));

/** The chain of reasoning to 0: no one should guess above two-thirds of 100, so no one above two-thirds of that, … */
export const chain = (steps: number): number[] => Array.from({ length: steps + 1 }, (_, i) => 100 * FRACTION ** i);

export interface Crowd {
  id: string;
  name: string;
  /** What you are told about them before you guess. */
  about: string;
  /** How many bots think each number of steps. */
  mix: [steps: number, count: number][];
}

export const CROWDS: Crowd[] = [
  {
    id: 'fest',
    name: 'A college fest crowd',
    about: 'Students trying the game at a stall at a college fest. Most have never played it.',
    mix: [
      [0, 4],
      [1, 4],
      [2, 2],
      [3, 1],
    ],
  },
  {
    id: 'again',
    name: 'The same crowd, again',
    about: 'The same students play a second time. They have seen the first round’s average and winner.',
    mix: [
      [1, 4],
      [2, 4],
      [3, 2],
      [4, 1],
    ],
  },
  {
    id: 'readers',
    name: 'Newspaper readers',
    about: 'Readers of a business newspaper who send in a number. A few have read about the game before.',
    mix: [
      [0, 3],
      [1, 4],
      [2, 2],
      [3, 1],
      [Infinity, 1],
    ],
  },
  {
    id: 'class',
    name: 'A game theory class',
    about: 'Students who have just been taught that the “rational” answer is 0.',
    mix: [
      [1, 2],
      [2, 2],
      [3, 2],
      [Infinity, 5],
    ],
  },
];

export interface Bot {
  steps: number;
  guess: number;
}

/** A crowd's bots, in a random order. */
export const drawCrowd = (crowd: Crowd, random: Random): Bot[] =>
  shuffle(
    crowd.mix.flatMap(([steps, n]) => Array.from({ length: n }, () => steps)),
    random,
  ).map((steps) => ({ steps, guess: botGuess(steps, random) }));

export interface Result {
  /** The average of every guess, yours included. */
  average: number;
  /** Two-thirds of the average. */
  target: number;
  /** The winning guesses: the closest to the target, more than one if tied. */
  winning: number[];
  youWon: boolean;
  yourDistance: number;
  /** Your place among the twelve: 1 if no one was closer. */
  rank: number;
}

/** A round: the bots' guesses and yours. */
export function play(bots: readonly number[], you: number): Result {
  const all = [you, ...bots];
  const average = all.reduce((s, g) => s + g, 0) / all.length;
  const target = FRACTION * average;
  const off = (g: number) => Math.abs(g - target);
  const best = Math.min(...all.map(off));
  const near = (g: number) => off(g) - best < 1e-9;
  return {
    average,
    target,
    winning: [...new Set(all.filter(near))].sort((a, b) => a - b),
    youWon: near(you),
    yourDistance: off(you),
    rank: 1 + bots.filter((g) => off(g) < off(you) - 1e-9).length,
  };
}

/** The same round with another guess in place of yours. */
export const replay = (bots: readonly number[], guess: number) => {
  const r = play(bots, guess);
  return { distance: r.yourDistance, won: r.youWon };
};

/** The guess a depth makes, as a whole number: 50, 33, 22, 15 or 0. */
export const depthGuess = (k: number): number => Math.round(stepGuess(k));

/** Over your rounds: how far each depth's guess would have been from the target on average, and which was closest. */
export function summarise(rounds: { bots: readonly number[] }[]) {
  const distance = DEPTHS.map(
    (k) => rounds.reduce((s, r) => s + replay(r.bots, depthGuess(k)).distance, 0) / rounds.length,
  );
  const wins = DEPTHS.map((k) => rounds.filter((r) => replay(r.bots, depthGuess(k)).won).length);
  return { distance, wins, best: DEPTHS[distance.indexOf(Math.min(...distance))]! };
}

/** Many replays of each crowd: how far each depth's guess is from the target on average, how often it wins, and the best. */
export const simulate = (trials: number, random: Random) =>
  CROWDS.map((crowd) => {
    const rounds = Array.from({ length: trials }, () => ({ bots: drawCrowd(crowd, random).map((b) => b.guess) }));
    return { crowd: crowd.id, ...summarise(rounds) };
  });

/** Replays of each crowd the debrief shows, always the same ones: enough for steady averages, quick to run. */
export const REPLAYS = 1000;
export const debriefReplays = () => simulate(REPLAYS, seeded(1));
