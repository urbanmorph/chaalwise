import type { SkillId } from '@chaalwise/core/skills';
import { shortDate } from '../short-date';

/** A lab as the site's pages and the lesson player know it. What it teaches and how it plays are in about.ts. */
export interface Lab {
  slug: string;
  title: string;
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
    track: 'cooperate',
    entry: 'labs/prisoners-dilemma',
    read: ['labs/tit-for-tat', 'strategy/cooperate-or-defend', 'labs/nash-equilibrium'],
  },
  {
    slug: 'rock-paper-scissors',
    title: 'Rock-paper-scissors',
    track: 'unpredictable',
    entry: 'labs/mixed-strategy',
    read: ['strategy/be-unpredictable', 'labs/zero-sum-game'],
  },
  {
    slug: 'sealed-bid-auction',
    title: 'Sealed-bid auction',
    track: 'value',
    entry: 'labs/winners-curse',
    read: ['strategy/winners-curse'],
  },
  {
    slug: 'nim',
    title: 'Nim',
    track: 'calculate',
    entry: 'labs/backward-induction',
    read: ['strategy/count-it-through'],
  },
  {
    slug: 'rule-finder',
    title: 'Rule finder',
    track: 'read-hidden',
    entry: 'strategy/test-to-disprove',
    read: [],
  },
  {
    slug: 'split-the-pie',
    title: 'Split the pie',
    track: 'value',
    entry: 'strategy/walk-away-point',
    read: [],
  },
  {
    slug: 'which-bag',
    title: 'Which bag?',
    track: 'weigh-odds',
    entry: 'strategy/base-rates',
    read: ['strategy/regression-to-the-mean'],
  },
  {
    slug: 'gain-or-loss',
    title: 'Gain or loss?',
    track: 'composure',
    entry: 'strategy/framing',
    read: ['strategy/sunk-cost', 'poker/tilt'],
  },
  {
    slug: 'bonus-rule',
    title: 'The bonus rule',
    track: 'think-ahead',
    entry: 'strategy/incentives',
    read: ['strategy/their-next-move'],
  },
  {
    slug: 'ask-the-panel',
    title: 'Ask the panel',
    track: 'read-hidden',
    entry: 'strategy/independent-estimates',
    read: ['strategy/base-rates'],
  },
  {
    slug: 'pick-the-same',
    title: 'Pick the same',
    track: 'cooperate',
    entry: 'strategy/coordination',
    read: ['strategy/cooperate-or-defend', 'labs/nash-equilibrium'],
  },
  {
    slug: 'first-number',
    title: 'First number wins?',
    track: 'read-hidden',
    entry: 'strategy/anchoring',
    read: ['strategy/information-advantage', 'strategy/independent-estimates'],
  },
  {
    slug: 'who-moves-first',
    title: 'Who moves first',
    track: 'think-ahead',
    entry: 'labs/credible-threats',
    read: ['labs/backward-induction', 'strategy/their-next-move'],
  },
  {
    slug: 'split-it-fairly',
    title: 'Split it fairly?',
    track: 'cooperate',
    entry: 'labs/fairness-and-trust',
    read: ['labs/tit-for-tat', 'strategy/cooperate-or-defend'],
  },
  {
    slug: 'trade-what-matters-less',
    title: 'Trade what matters less',
    track: 'value',
    entry: 'labs/logrolling',
    read: ['strategy/walk-away-point'],
  },
  {
    slug: 'used-scooters',
    title: 'Used scooters',
    track: 'read-hidden',
    entry: 'labs/market-for-lemons',
    read: ['strategy/costly-signals', 'strategy/information-advantage'],
  },
];

export const labHref = (lab: Pick<Lab, 'slug'>): string => `/labs/${lab.slug}/`;

/** A lab named in a sentence, such as "the Nim lab"; a title that starts with "The" drops it: "the bonus rule lab". */
export const theLab = (lab: Pick<Lab, 'title'>): string => `the ${lab.title.replace(/^The /, '')} lab`;

/** The labs a strategy or poker lesson offers at its end: the lab it follows first, then those that train its skills. */
export function labsForLesson({
  game,
  after,
  skills,
}: {
  game: string;
  after?: string | undefined;
  skills: string[];
}): Lab[] {
  if (game !== 'strategy' && game !== 'poker') return [];
  const follows = (lab: Lab) => after === `labs/${lab.slug}`;
  return [...LABS.filter(follows), ...LABS.filter((l) => !follows(l) && skills.includes(l.track))];
}

/** Each lab, with when it was last played to the end on this device and how often, from the finished records. */
export function labsPlayed(records: { lessonId: string; completedAt: Date; times: number }[]) {
  return LABS.map(({ slug, title }) => {
    const record = records.find((r) => r.lessonId === `labs/${slug}`);
    return { slug, title, at: record?.completedAt, times: record?.times ?? 0 };
  });
}

/** When a lab was last played: one short line, like "Not yet", so the list does not move as it loads. */
export const playedLabel = (at: Date | undefined, times: number): string =>
  !at ? 'Not yet' : `${shortDate(at)}${times > 1 ? `, ${times} times` : ''}`;
