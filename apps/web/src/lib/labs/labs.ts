import type { SkillId } from '@chaalwise/core/skills';

export interface Lab {
  slug: string;
  title: string;
  /** The idea it teaches, in a sentence. */
  idea: string;
  /** How it plays, in a sentence. */
  plays: string;
  /** The strategy track it trains. */
  track: SkillId;
  /** The reference entry whose questions make the debrief. */
  entry: string;
  /** Other reference entries to read after playing. */
  read: string[];
}

export const LABS: Lab[] = [
  {
    slug: 'prisoners-dilemma',
    title: "Prisoner's Dilemma",
    idea: 'Cooperation pays when you will meet again and nobody knows which round is the last.',
    plays: 'About ten rounds against each of five bots: cooperate or defect, and watch the points.',
    track: 'cooperate',
    entry: 'labs/prisoners-dilemma',
    read: ['labs/tit-for-tat', 'strategy/cooperate-or-defend', 'labs/nash-equilibrium'],
  },
  {
    slug: 'rock-paper-scissors',
    title: 'Rock-paper-scissors',
    idea: 'If you are predictable, someone can exploit you. A random mix cannot be beaten.',
    plays: '30 throws against a bot that learns your habits as you play.',
    track: 'unpredictable',
    entry: 'labs/mixed-strategy',
    read: ['strategy/be-unpredictable', 'labs/zero-sum-game'],
  },
  {
    slug: 'sealed-bid-auction',
    title: 'Sealed-bid auction',
    idea: 'The winner of an auction for something of uncertain value is usually the one who overestimated it.',
    plays: 'Five jars of coins, one sealed bid each, against four bots.',
    track: 'value',
    entry: 'labs/winners-curse',
    read: ['strategy/winners-curse'],
  },
];

export const labHref = (lab: Lab): string => `/labs/${lab.slug}/`;
