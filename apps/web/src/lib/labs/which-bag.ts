import { between, type Random } from './seeded';

/* Part 1: base rates. */

export type Colour = 'red' | 'blue';

/** Ten bags of ten balls: eight mostly red, two mostly blue. */
export const BAGS: Record<Colour, { count: number; reds: number; blues: number }> = {
  red: { count: 8, reds: 7, blues: 3 },
  blue: { count: 2, reds: 3, blues: 7 },
};
const TOTAL = BAGS.red.count + BAGS.blue.count;

/** The balls drawn from one bag, each put back before the next. */
export interface Draw {
  red: number;
  blue: number;
}

/** The chance a bag of this kind gives this draw, in any order. */
function likelihood(kind: Colour, { red, blue }: Draw): number {
  const bag = BAGS[kind];
  const orders = red && blue ? 2 : 1;
  return orders * (bag.reds / 10) ** red * (bag.blues / 10) ** blue;
}

/**
 * Bayes as counts: out of so many bag picks, how many times each kind of bag
 * gives this draw. 100 picks for one ball, 1,000 for two, so the counts stay whole.
 */
export function counts(draw: Draw): { picks: number; red: number; blue: number } {
  const picks = draw.red + draw.blue > 1 ? 1000 : 100;
  const times = (kind: Colour) => Math.round((picks * BAGS[kind].count * likelihood(kind, draw)) / TOTAL);
  return { picks, red: times('red'), blue: times('blue') };
}

/** The chance this draw came from a mostly-red bag. */
export function chanceRed(draw: Draw): number {
  const c = counts(draw);
  return c.red / (c.red + c.blue);
}

export interface BagRound {
  draw: Draw;
  /** The balls in the order drawn. */
  balls: Colour[];
  /** The kind of bag it really was. */
  bag: Colour;
}

/** The eight draws, shuffled: blue balls come up often enough to test the base rate. */
const DRAWS: Draw[] = [
  { red: 0, blue: 1 },
  { red: 1, blue: 0 },
  { red: 0, blue: 2 },
  { red: 1, blue: 1 },
  { red: 0, blue: 1 },
  { red: 2, blue: 0 },
  { red: 0, blue: 1 },
  { red: 1, blue: 1 },
];

/**
 * Eight rounds. Choosing the draw first and then the bag at the odds that draw
 * gives is the same as picking a bag at random and drawing from it, for every
 * round, but makes sure the telling draws come up.
 */
export function bagRounds(random: Random): BagRound[] {
  const draws = DRAWS.map((d) => ({ d, key: random() }))
    .sort((a, b) => a.key - b.key)
    .map(({ d }) => d);
  return draws.map((draw) => {
    const balls: Colour[] = [...Array<Colour>(draw.red).fill('red'), ...Array<Colour>(draw.blue).fill('blue')];
    if (random() < 0.5) balls.reverse();
    return { draw, balls, bag: random() < chanceRed(draw) ? 'red' : 'blue' };
  });
}

/* Part 2: regression to the mean. */

export const PLAYERS = 10;
const NAMES = ['Asha', 'Ben', 'Chen', 'Divya', 'Emeka', 'Farah', 'Gita', 'Hiro', 'Imran', 'Jaya'];
/** Skill runs from 35 to 65; each game adds luck of up to 30 either way. */
const SKILL: [number, number] = [35, 65];
const LUCK = 30;
/** The games behind each player's record. */
export const RECORD = 10;

export interface Player {
  name: string;
  /** Hidden: what the player scores on average. */
  skill: number;
  /** Their average over the last RECORD games. */
  form: number;
  /** Their round-one score. */
  first: number;
}

const game = (skill: number, random: Random) => skill + between(-LUCK, LUCK, random);
/** The player who scores highest by `by`; the first, if level. */
export const best = (players: Player[], by: (p: Player) => number) => players.reduce((a, b) => (by(b) > by(a) ? b : a));

/** Ten players, each with a record and a round-one score; the round-one top scorer is never the one with the best record. */
export function drawPlayers(random: Random): Player[] {
  for (;;) {
    const players = NAMES.map((name) => {
      const skill = between(SKILL[0], SKILL[1], random);
      let sum = 0;
      for (let i = 0; i < RECORD; i++) sum += game(skill, random);
      return { name, skill, form: Math.round(sum / RECORD), first: game(skill, random) };
    });
    if (best(players, (p) => p.first) !== best(players, (p) => p.form)) return players;
  }
}

/** Round two: the same skill, fresh luck. */
export const playRound = (players: Player[], random: Random): number[] => players.map((p) => game(p.skill, random));

/** Over many games, the average round-one and round-two scores of the round-one top three and bottom three. */
export function regression(trials: number, random: Random) {
  const sums = { top: { first: 0, second: 0 }, bottom: { first: 0, second: 0 } };
  for (let t = 0; t < trials; t++) {
    const players = drawPlayers(random);
    const second = playRound(players, random);
    const order = players.map((p, i) => ({ first: p.first, second: second[i]! })).sort((a, b) => b.first - a.first);
    for (const [group, rows] of [
      ['top', order.slice(0, 3)],
      ['bottom', order.slice(-3)],
    ] as const)
      for (const r of rows) {
        sums[group].first += r.first;
        sums[group].second += r.second;
      }
  }
  const avg = (n: number) => n / (trials * 3);
  return {
    top: { first: avg(sums.top.first), second: avg(sums.top.second) },
    bottom: { first: avg(sums.bottom.first), second: avg(sums.bottom.second) },
  };
}
