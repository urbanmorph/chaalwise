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
    idea: 'Cooperation pays when you will meet again, nobody knows which round is the last, and the other side answers in kind.',
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
  {
    slug: 'nim',
    title: 'Nim',
    idea: 'Work backwards from the goal: find the positions you want to leave, and the first move follows.',
    plays:
      'Take one to three counters from a pile; whoever takes the last one wins. Five games against a bot that plays perfectly when it can.',
    track: 'calculate',
    entry: 'labs/backward-induction',
    read: ['strategy/count-it-through'],
  },
  {
    slug: 'rule-finder',
    title: 'Rule finder',
    idea: 'To find out whether you are right, include tests that would prove you wrong, not only ones that would confirm you.',
    plays: 'Guess the hidden rule behind a few numbers by trying your own; announce it when you are sure.',
    track: 'read-hidden',
    entry: 'strategy/test-to-disprove',
    read: [],
  },
  {
    slug: 'split-the-pie',
    title: 'Split the pie',
    idea: 'Know your walk-away point and theirs before you bargain: the deal lies between them.',
    plays: 'Five negotiations over 100 points against bots, each side with its own walk-away point.',
    track: 'value',
    entry: 'strategy/walk-away-point',
    read: [],
  },
  {
    slug: 'which-bag',
    title: 'Which bag?',
    idea: 'Start from how common something is, then adjust for what you see. And a streak of luck usually ends.',
    plays: 'Guess which bag a ball came from, then pick players for the next round after a lucky one.',
    track: 'weigh-odds',
    entry: 'strategy/base-rates',
    read: ['strategy/regression-to-the-mean'],
  },
  {
    slug: 'gain-or-loss',
    title: 'Gain or loss?',
    idea: 'The same choice, put as a gain or as a loss, gets different answers. Restate it the other way before you decide.',
    plays:
      'Eight choices between a sure thing and a gamble, then see where your answers changed with the wording alone.',
    track: 'composure',
    entry: 'strategy/framing',
    read: ['strategy/sunk-cost', 'poker/tilt'],
  },
  {
    slug: 'bonus-rule',
    title: 'The bonus rule',
    idea: 'People do what a rule rewards, not what you hoped for. Before you set one, ask what is the cheapest way to score on it.',
    plays: 'Four weeks setting the bonus for a support team of bots, and seeing what they do to earn it.',
    track: 'think-ahead',
    entry: 'strategy/incentives',
    read: ['strategy/their-next-move'],
  },
  {
    slug: 'ask-the-panel',
    title: 'Ask the panel',
    idea: 'Independent guesses, averaged, cancel each other’s errors. Guesses that follow the first voice do not.',
    plays: 'Six boxes of dots to estimate with a panel of bots: some rounds alone, some after hearing a first guess.',
    track: 'read-hidden',
    entry: 'strategy/independent-estimates',
    read: ['strategy/base-rates'],
  },
  {
    slug: 'pick-the-same',
    title: 'Pick the same',
    idea: 'When everyone gains by choosing alike, pick what stands out to everyone, not your favourite. To get a group to aim high, go first where all can see.',
    plays:
      'Four meet-ups with a crowd of bots and no way to talk, then eight hunts where a stag is caught only if all five hunters go for it.',
    track: 'cooperate',
    entry: 'strategy/coordination',
    read: ['strategy/cooperate-or-defend', 'labs/nash-equilibrium'],
  },
];

export const labHref = (lab: Pick<Lab, 'slug'>): string => `/labs/${lab.slug}/`;

/** Each lab, with when it was last played to the end on this device and how often, from the finished records. */
export function labsPlayed(records: { lessonId: string; completedAt: Date; times: number }[]) {
  return LABS.map(({ slug, title }) => {
    const record = records.find((r) => r.lessonId === `labs/${slug}`);
    return { slug, title, at: record?.completedAt, times: record?.times ?? 0 };
  });
}

/** When a lab was last played: one short line, like "Not yet", so the list does not move as it loads. */
export const playedLabel = (at: Date | undefined, times: number): string =>
  !at
    ? 'Not yet'
    : `${at.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}${times > 1 ? `, ${times} times` : ''}`;
