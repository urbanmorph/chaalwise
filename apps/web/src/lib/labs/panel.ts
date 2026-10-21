import { between, shuffle, type Random } from './seeded';

/**
 * Ask the panel, after Galton's ox (1907) and Lorenz and colleagues (2011): a
 * panel of bots estimates how many dots are in a box. Each bot is wrong by its
 * own amount. Guessing alone, their errors largely cancel in the average; after
 * hearing a first voice, each leans towards it, so its error is shared and does not.
 */

/** Bots on the panel. */
export const PANEL = 8;
/** The fewest and most dots in a box. */
export const DOTS: [number, number] = [120, 480];
/** The box the dots are drawn in, and the least gap between two dots. */
export const BOX = { width: 360, height: 220, gap: 7 };
/** How far a bot's own guess strays: the spread of its error on a ratio scale (about 1 in 4 off, typically). */
const SPREAD = 0.3;
/** How far a bot moves towards the first voice, on a ratio scale: halfway. */
const PULL = 0.5;

/** A standard normal number (Box-Muller). */
const normal = (random: Random) => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());

/**
 * The panel's guesses at `truth`; the first is the first voice. Alone, each
 * guesses on its own. After hearing the first voice, each other bot moves
 * halfway from its own guess towards it (the geometric mean of the two).
 */
export function panelGuesses(truth: number, heard: boolean, random: Random): number[] {
  const own = Array.from({ length: PANEL }, () => Math.round(truth * Math.exp(SPREAD * normal(random))));
  if (!heard) return own;
  const first = own[0]!;
  return own.map((g, i) => (i === 0 ? g : Math.round(first ** PULL * g ** (1 - PULL))));
}

export const average = (xs: number[]): number => Math.round(xs.reduce((s, x) => s + x, 0) / xs.length);

/** How far off a guess is, as a fraction of the truth. */
export const offBy = (guess: number, truth: number): number => Math.abs(guess - truth) / truth;

/** Dots scattered in the box, none closer than the gap to another. */
function scatter(count: number, random: Random): [number, number][] {
  const points: [number, number][] = [];
  const pad = 4;
  while (points.length < count) {
    const p: [number, number] = [pad + random() * (BOX.width - 2 * pad), pad + random() * (BOX.height - 2 * pad)];
    if (points.every(([x, y]) => Math.hypot(x - p[0], y - p[1]) >= BOX.gap)) points.push(p);
  }
  return points.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
}

export interface PanelRound {
  dots: number;
  /** Whether everyone hears the first voice before guessing. */
  heard: boolean;
  points: [number, number][];
  guesses: number[];
}

/** Six boxes of dots: three guessed alone and three after a first voice, in a random order. */
export function drawRounds(random: Random): PanelRound[] {
  return shuffle([true, true, true, false, false, false], random).map((h) => {
    const dots = between(DOTS[0], DOTS[1], random);
    return { dots, heard: h, points: scatter(dots, random), guesses: panelGuesses(dots, h, random) };
  });
}

/** Over many panels: how far off one bot is on average, and the panel's average when guessing alone and after a first voice. */
export function typical(trials: number, random: Random) {
  let [one, alone, heard] = [0, 0, 0];
  for (let t = 0; t < trials; t++) {
    const truth = between(DOTS[0], DOTS[1], random);
    const own = panelGuesses(truth, false, random);
    one += offBy(own[1]!, truth);
    alone += offBy(average(own), truth);
    heard += offBy(average(panelGuesses(truth, true, random)), truth);
  }
  return { one: one / trials, alone: alone / trials, heard: heard / trials };
}
