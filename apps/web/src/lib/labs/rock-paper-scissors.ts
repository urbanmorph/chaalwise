import type { Random } from './seeded';

export type Throw = 'rock' | 'paper' | 'scissors';
export type Outcome = 'win' | 'loss' | 'draw';

export const THROWS: readonly Throw[] = ['rock', 'paper', 'scissors'];

/** The throw that beats this one. */
export const counter = (t: Throw): Throw => THROWS[(THROWS.indexOf(t) + 1) % 3]!;

/** How a round went for the first player. */
export const outcome = (mine: Throw, theirs: Throw): Outcome =>
  mine === theirs ? 'draw' : counter(theirs) === mine ? 'win' : 'loss';

const randomThrow = (random: Random): Throw => THROWS[Math.floor(random() * 3)]!;

type Counts = Map<string, Record<Throw, number>>;

/** The one throw seen most often, or none when nothing has been seen or two are level. */
function likeliest(counts: Record<Throw, number> | undefined): Throw | undefined {
  if (!counts) return undefined;
  const best = Math.max(...THROWS.map((t) => counts[t]));
  const top = THROWS.filter((t) => counts[t] === best);
  return best > 0 && top.length === 1 ? top[0] : undefined;
}

/**
 * A bot that learns your patterns. It counts what you threw after each pair of
 * throws (and after each single throw), guesses your likeliest next throw and
 * plays what beats it. With nothing to go on, it throws at random.
 */
export class PatternBot {
  private history: Throw[] = [];
  private readonly afterTwo: Counts = new Map();
  private readonly afterOne: Counts = new Map();

  private static count(counts: Counts, key: string, next: Throw) {
    const row = counts.get(key) ?? { rock: 0, paper: 0, scissors: 0 };
    row[next]++;
    counts.set(key, row);
  }

  /** Learn from the learner's throw. */
  see(t: Throw): void {
    const [two, one] = [this.history.at(-2), this.history.at(-1)];
    if (one) PatternBot.count(this.afterOne, one, t);
    if (two && one) PatternBot.count(this.afterTwo, `${two} ${one}`, t);
    this.history.push(t);
  }

  /** The learner's likeliest next throw, if the bot has a clear guess. */
  predict(): Throw | undefined {
    const [two, one] = [this.history.at(-2), this.history.at(-1)];
    if (!one) return undefined;
    return (two && likeliest(this.afterTwo.get(`${two} ${one}`))) || likeliest(this.afterOne.get(one));
  }

  play(random: Random): Throw {
    const guess = this.predict();
    return guess ? counter(guess) : randomThrow(random);
  }
}

export interface Pattern {
  /** The pair of throws in a row the learner made most often. */
  pair?: { first: Throw; then: Throw; count: number } | undefined;
  favourite: { throw: Throw; count: number };
}

/** How predictable a run of throws was. */
export function describePattern(history: readonly Throw[]): Pattern {
  const pairs = new Map<string, number>();
  let pair: Pattern['pair'];
  for (let i = 1; i < history.length; i++) {
    const [first, then] = [history[i - 1]!, history[i]!];
    const key = `${first} ${then}`;
    const count = (pairs.get(key) ?? 0) + 1;
    pairs.set(key, count);
    if (!pair || count > pair.count) pair = { first, then, count };
  }
  const tally = THROWS.map((t) => ({ throw: t, count: history.filter((h) => h === t).length }));
  const favourite = tally.reduce((best, t) => (t.count > best.count ? t : best));
  return { pair, favourite };
}
