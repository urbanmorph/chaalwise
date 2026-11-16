import type { SkillId } from '@chaalwise/core/skills';
import { ideaOf, type LabIndex, type LabRef } from './lab-ref';

export { labHref, theLab } from './lab-ref';

/**
 * A lab as the site's pages know it, at build time. What it teaches and how it plays are in about.ts. Code in the
 * browser never imports this list: it gets the labs it needs as data (lab-ref.ts).
 */
export interface Lab extends LabRef {
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
  {
    slug: 'guess-two-thirds',
    title: 'Guess two-thirds',
    track: 'think-ahead',
    entry: 'labs/beauty-contest',
    read: ['strategy/their-next-move'],
  },
  {
    slug: 'follow-the-queue',
    title: 'Follow the queue?',
    track: 'read-hidden',
    entry: 'strategy/information-cascades',
    read: ['strategy/independent-estimates', 'strategy/base-rates'],
  },
  {
    slug: 'shared-fund',
    title: 'The shared fund',
    track: 'cooperate',
    entry: 'labs/public-goods',
    read: ['labs/prisoners-dilemma', 'labs/fairness-and-trust'],
  },
  {
    slug: 'who-backs-down',
    title: 'Who backs down?',
    track: 'size-risk',
    entry: 'labs/hawk-dove',
    read: ['labs/credible-threats', 'labs/mixed-strategy'],
  },
  {
    slug: 'who-sets-the-agenda',
    title: 'Who sets the agenda?',
    track: 'think-ahead',
    entry: 'labs/agenda-setting',
    read: ['strategy/framing', 'strategy/their-next-move'],
  },
  {
    slug: 'fair-shares',
    title: 'Fair shares',
    track: 'value',
    entry: 'labs/shapley-value',
    read: ['labs/fairness-and-trust', 'strategy/walk-away-point'],
  },
  {
    slug: 'wait-them-out',
    title: 'Wait them out?',
    track: 'composure',
    entry: 'labs/war-of-attrition',
    read: ['strategy/sunk-cost', 'strategy/costly-signals', 'labs/hawk-dove'],
  },
];

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

/**
 * The lab each idea is met in: a lab's own debrief entry and its `labs/<slug>`, then a game-theory idea with no lab
 * of its own, such as tit for tat, in the first lab that teaches it. Given card ids, only the ideas they ask about.
 */
export function labIndex(cardIds?: Iterable<string>): LabIndex {
  const index: LabIndex = {};
  const add = (idea: string, { slug, title }: Lab) => (index[idea] ??= { slug, title });
  for (const lab of LABS) [lab.entry, `labs/${lab.slug}`].forEach((idea) => add(idea, lab));
  for (const lab of LABS) lab.read.filter((idea) => idea.startsWith('labs/')).forEach((idea) => add(idea, lab));
  if (!cardIds) return index;
  const asked = new Set([...cardIds].map(ideaOf));
  return Object.fromEntries(Object.entries(index).filter(([idea]) => asked.has(idea)));
}
