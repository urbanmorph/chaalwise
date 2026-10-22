import { between, type Random } from './seeded';

/**
 * Pick the same: coordination, in two parts.
 *
 * Meeting without a word, after Schelling's focal points (1960) and Mehta,
 * Starmer and Sugden (1994): a crowd of bots each tries to pick what you pick,
 * with no way to talk. Asked to match, they crowd onto the answer that stands
 * out; asked what they like best, they spread out. The leanings are this lab's
 * design, set near Schelling's heads-or-tails result (36 of 42 said heads).
 *
 * The stag hunt, after Rousseau (1755) and Skyrms (2004): five hunters catch a
 * stag only if all five hunt it; anyone can catch a hare alone. The bots trust
 * by different rules, so the learner sees how a credible signal and a track
 * record bring the group to the stag, and how one defector sinks it.
 */

export interface Meet {
  /** The situation, naming its setting. */
  prompt: string;
  options: string[];
  /** How often a bot trying to match you picks each option. */
  match: number[];
  /** How often a bot picks each option as its own favourite. */
  like: number[];
  /** Draw the options as a three-by-three grid of squares, the shaded one being `focal`. */
  grid?: boolean;
}

/** Bots in the crowd you try to match. */
export const CROWD = 10;

const GRID = [
  'Top left',
  'Top middle',
  'Top right',
  'Middle left',
  'Centre',
  'Middle right',
  'Bottom left',
  'Bottom middle',
  'Bottom right',
];

export const MEETS: Meet[] = [
  {
    prompt: 'A coin game: you and each bot say heads or tails. You score with every bot that says the same as you.',
    options: ['Heads', 'Tails'],
    match: [0.85, 0.15],
    like: [0.55, 0.45],
  },
  {
    prompt:
      'You and a friend have lost each other in a big city you both know, and neither phone works. You never agreed where to meet. Where do you go?',
    options: [
      'The main railway station, under its clock',
      'The café you like best',
      'The biggest museum',
      'The park nearest to you',
    ],
    match: [0.7, 0.05, 0.15, 0.1],
    like: [0.2, 0.35, 0.25, 0.2],
  },
  {
    prompt: 'Same city, same day, still no phones. At what time do you go there, and wait?',
    options: ['10 in the morning', '12 noon', '3:30 in the afternoon', '6 in the evening'],
    match: [0.1, 0.75, 0.05, 0.1],
    like: [0.3, 0.2, 0.25, 0.25],
  },
  {
    prompt: 'Nine squares, one of them shaded. You and each bot pick one square.',
    options: GRID,
    // The shaded square is bottom right; top left, where reading starts, is the runner-up.
    match: [0.12, 0.01, 0.01, 0.01, 0.05, 0.01, 0.01, 0.01, 0.77],
    like: [0.12, 0.1, 0.1, 0.1, 0.2, 0.1, 0.1, 0.08, 0.1],
    grid: true,
  },
];

/** The option that stands out: the one bots trying to match pick most. */
export const focal = (meet: Meet): number => meet.match.indexOf(Math.max(...meet.match));

/** One pick from weights that add up to 1. */
function pick(weights: number[], random: Random): number {
  let r = random();
  for (const [i, w] of weights.entries()) {
    if (r < w) return i;
    r -= w;
  }
  return weights.length - 1;
}

/** A crowd's picks, one per bot. */
export const crowdPicks = (weights: number[], random: Random): number[] =>
  Array.from({ length: CROWD }, () => pick(weights, random));

/** Every meet-up's crowd: what each bot picks when trying to match you, and what it would pick as its favourite. */
export const drawMeets = (random: Random) =>
  MEETS.map((m) => ({ match: crowdPicks(m.match, random), like: crowdPicks(m.like, random) }));

/** How many picked each of `n` options. */
export const tally = (picks: number[], n: number): number[] =>
  Array.from({ length: n }, (_, i) => picks.filter((p) => p === i).length);

/** How many bots you can expect to match by picking `option`. */
export const expectedMatches = (meet: Meet, option: number): number => CROWD * meet.match[option]!;

export type Hunt = 'stag' | 'hare';
/** What you tell the others first: nothing, a word, or setting out first where all can see (then you hunt the stag). */
export type Signal = 'none' | 'word' | 'first';
export type HunterId = 'ana' | 'ben' | 'chen' | 'dev';

export const HUNTERS: { id: HunterId; name: string; style: string }[] = [
  { id: 'ana', name: 'Ana', style: 'Hunts the stag, unless she was let down last time.' },
  { id: 'ben', name: 'Ben', style: 'Hunts the stag after a catch, or if you say you will, while your word is good.' },
  {
    id: 'chen',
    name: 'Chen',
    style: 'Was let down before. Ignores words; needs to see you go first, or two catches in a row.',
  },
  { id: 'dev', name: 'Dev', style: 'Like Ben, but on one day he may get a better offer elsewhere.' },
];

/** Hunts in the second part. */
export const HUNTS = 8;

export const huntPoints = (you: Hunt, caught: boolean): number => (you === 'hare' ? 3 : caught ? 6 : 0);

export interface HuntRound {
  signal: Signal;
  you: Hunt;
  bots: Record<HunterId, Hunt>;
  caught: boolean;
}

/** Stags caught in a row, up to the last hunt. */
const streak = (history: HuntRound[]): number => {
  let n = 0;
  for (let i = history.length - 1; i >= 0 && history[i]!.caught; i--) n++;
  return n;
};

/** What a bot hunts in hunt `round` (from 1), given the hunts so far and what you signalled. Dev defects in round `defectAt`. */
export function botHunt(id: HunterId, history: HuntRound[], signal: Signal, round: number, defectAt: number): Hunt {
  const last = history.at(-1);
  const wordGood = !history.some((r) => r.signal === 'word' && r.you === 'hare');
  const believes = signal === 'first' || streak(history) >= 1 || (signal === 'word' && wordGood);
  const stag =
    id === 'ana'
      ? signal === 'first' || !(last && last.bots.ana === 'stag' && !last.caught)
      : id === 'chen'
        ? signal === 'first' || streak(history) >= 2
        : id === 'dev'
          ? round !== defectAt && believes
          : believes;
  return stag ? 'stag' : 'hare';
}

/** Play one hunt: setting out first commits you to the stag. */
export function playHunt(history: HuntRound[], signal: Signal, you: Hunt, defectAt: number): HuntRound {
  const mine: Hunt = signal === 'first' ? 'stag' : you;
  const round = history.length + 1;
  const bots = Object.fromEntries(
    HUNTERS.map((h) => [h.id, botHunt(h.id, history, signal, round, defectAt)]),
  ) as Record<HunterId, Hunt>;
  return { signal, you: mine, bots, caught: mine === 'stag' && Object.values(bots).every((b) => b === 'stag') };
}

/** The hunt in which Dev takes a better offer elsewhere: round 5, 6 or 7. */
export const defectRound = (random: Random): number => between(5, 7, random);
