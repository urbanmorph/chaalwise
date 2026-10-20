import { between, seeded, type Random } from './seeded';

/** Cooperate or defect. */
export type Move = 'C' | 'D';

export type BotId = 'kind' | 'selfish' | 'tit-for-tat' | 'forgiving' | 'random';

export interface Bot {
  id: BotId;
  name: string;
  /** What it does, in a sentence. */
  style: string;
}

export const BOTS: Bot[] = [
  { id: 'kind', name: 'Always kind', style: 'Cooperates every round, whatever you do.' },
  { id: 'selfish', name: 'Always selfish', style: 'Defects every round, whatever you do.' },
  { id: 'tit-for-tat', name: 'Tit for tat', style: 'Cooperates first, then copies your last move.' },
  { id: 'forgiving', name: 'Forgiving', style: 'Like tit for tat, but forgives a defection 1 time in 3.' },
  { id: 'random', name: 'Unpredictable', style: 'Cooperates or defects at random, half and half.' },
];

export const botName = (id: BotId): string => BOTS.find((b) => b.id === id)!.name;

/** Points for one round, as [mine, theirs]. */
export function payoff(mine: Move, theirs: Move): [number, number] {
  if (mine === 'C') return theirs === 'C' ? [3, 3] : [0, 5];
  return theirs === 'C' ? [5, 0] : [1, 1];
}

/** The last round of a match: somewhere from 8 to 12, so nobody knows which round is the last. */
export const lastRound = (random: Random): number => between(8, 12, random);

/** A bot's next move, from its partner's moves so far. */
export function botMove(id: BotId, partner: readonly Move[], random: Random): Move {
  const last = partner.at(-1);
  switch (id) {
    case 'kind':
      return 'C';
    case 'selfish':
      return 'D';
    case 'tit-for-tat':
      return last ?? 'C';
    case 'forgiving':
      return last === 'D' && random() >= 1 / 3 ? 'D' : 'C';
    case 'random':
      return random() < 0.5 ? 'C' : 'D';
  }
}

export interface Round {
  a: Move;
  b: Move;
}

const flip = (m: Move): Move => (m === 'C' ? 'D' : 'C');

/**
 * Two bots play a match. With `noise`, each move comes out the other way with
 * that chance, like a message misread or a delivery that went wrong.
 */
export function playMatch(a: BotId, b: BotId, rounds: number, random: Random, noise = 0) {
  const movesA: Move[] = [];
  const movesB: Move[] = [];
  const totals: [number, number] = [0, 0];
  const slip = (m: Move) => (noise && random() < noise ? flip(m) : m);
  for (let i = 0; i < rounds; i++) {
    const ma = slip(botMove(a, movesB, random));
    const mb = slip(botMove(b, movesA, random));
    movesA.push(ma);
    movesB.push(mb);
    const [pa, pb] = payoff(ma, mb);
    totals[0] += pa;
    totals[1] += pb;
  }
  return { rounds: movesA.map((m, i): Round => ({ a: m, b: movesB[i]! })), totals };
}

/** Points per round each style earns against every style, itself included, over many matches. */
function pairings(random: Random, matches = 200): number[][] {
  return BOTS.map((a) =>
    BOTS.map((b) => {
      let points = 0;
      let rounds = 0;
      for (let i = 0; i < matches; i++) {
        const n = lastRound(random);
        points += playMatch(a.id, b.id, n, random).totals[0];
        rounds += n;
      }
      return points / rounds;
    }),
  );
}

export interface StyleRow extends Bot {
  /** Points per round, averaged over matches against every style, itself included. */
  average: number;
  /** Its share of a population after a few generations in which styles that score well grow. */
  early: number;
  /** Its share after many generations. */
  share: number;
}

/**
 * What each bot's style earns over many rounds: a round-robin, then an
 * "ecology" in which each generation a style grows in proportion to its points
 * (Axelrod's ecological tournament). The same seed always gives the same table.
 */
export function styleTable(seed = 2026, generations = 60, few = 10): StyleRow[] {
  const table = pairings(seeded(seed));
  let shares = BOTS.map(() => 1 / BOTS.length);
  let early = shares;
  for (let g = 0; g < generations; g++) {
    if (g === few) early = shares;
    const fitness = table.map((row) => row.reduce((sum, p, j) => sum + p * shares[j]!, 0));
    const mean = fitness.reduce((sum, f, i) => sum + f * shares[i]!, 0);
    shares = shares.map((s, i) => (s * fitness[i]!) / mean);
  }
  return BOTS.map((bot, i) => ({
    ...bot,
    average: table[i]!.reduce((s, p) => s + p, 0) / BOTS.length,
    early: early[i]!,
    share: shares[i]!,
  }));
}

/** Points per round when two tit-for-tats, or two forgiving players, meet and 1 move in 20 comes out wrong. */
export function noisyPair(seed = 7, rounds = 5000): { titForTat: number; forgiving: number } {
  const perRound = (id: BotId) => {
    const { totals } = playMatch(id, id, rounds, seeded(seed), 0.05);
    return (totals[0] + totals[1]) / 2 / rounds;
  };
  return { titForTat: perRound('tit-for-tat'), forgiving: perRound('forgiving') };
}
