import { shuffle, type Random } from './seeded';

/**
 * First number wins?, after the wheel of fortune in Tversky and Kahneman
 * (1974) and the fix in Mussweiler, Strack and Pfeiffer (2000): the learner
 * estimates six things, each just after someone else's first number, which is
 * high for one item of each kind and low for the other. Then the same six again,
 * after writing one reason the first number could be too high and one it could
 * be too low. Each item gives a range, and the lab's value is its middle, so the
 * value is worked from what the learner is told, not an outside statistic.
 */
export type Side = 'high' | 'low';
export type Kind = 'rent' | 'fest' | 'project';

export interface Item {
  id: string;
  kind: Kind;
  /** A short name for the debrief. */
  name: string;
  /** The setting, with the range it gives. */
  text: string;
  /** The question, after the first number. */
  ask: string;
  /** The range the text gives; the value is its middle. */
  range: [number, number];
  value: number;
  /** What its numbers count, such as "visitors". */
  unit: string;
  /** First numbers are rounded to this, as people say such numbers. */
  step: number;
  /** Who gives the first number, by whether it is high or low: `{n}` is the number with its unit, `{f}` the bare figure. */
  source: Record<Side, string>;
}

/** What an item's numbers count, for the debrief table. */
const UNITS: Record<Kind, string> = { rent: 'rupees a month', fest: 'visitors', project: 'weeks' };

const item = (i: Omit<Item, 'value' | 'unit'>): Item => ({
  ...i,
  value: (i.range[0] + i.range[1]) / 2,
  unit: UNITS[i.kind],
});

const RENT_SOURCE: Record<Side, string> = {
  high: 'The owner speaks first: “I was thinking of {n} a month.”',
  low: 'The tenant speaks first: “I was thinking of {n} a month.”',
};
/** A source that gives high and low numbers alike. */
const either = (text: string): Record<Side, string> => ({ high: text, low: text });
const WHEEL = either('Before you answer, a wheel of numbers is spun. It stops at {f}.');

export const ITEMS: Item[] = [
  item({
    id: 'rent-pune',
    kind: 'rent',
    name: 'Pune flat',
    text: 'A friend is letting her 2BHK flat in Pune (two bedrooms, a hall and a kitchen) to another friend of yours. Both ask you what a fair monthly rent is. In this lab, flats like it nearby rent for ₹22,000 to ₹32,000 a month.',
    ask: 'What is a fair rent for this flat, in rupees a month?',
    range: [22000, 32000],
    step: 1000,
    source: RENT_SOURCE,
  }),
  item({
    id: 'rent-coimbatore',
    kind: 'rent',
    name: 'Coimbatore flat',
    text: 'Your uncle is letting his 2BHK flat in Coimbatore (two bedrooms, a hall and a kitchen) to a young couple. Both sides ask you what a fair monthly rent is. In this lab, flats like it nearby rent for ₹12,000 to ₹18,000 a month.',
    ask: 'What is a fair rent for this flat, in rupees a month?',
    range: [12000, 18000],
    step: 1000,
    source: RENT_SOURCE,
  }),
  item({
    id: 'fest-chennai',
    kind: 'fest',
    name: 'Chennai fest',
    text: 'An engineering college in Chennai with 3,000 students holds its two-day fest (a college festival of music, dance and contests), open to all. In this lab, fests like it draw 2 to 4 visitors for each student over the two days.',
    ask: 'How many visitors will come over the two days?',
    range: [6000, 12000],
    step: 500,
    source: WHEEL,
  }),
  item({
    id: 'fest-lucknow',
    kind: 'fest',
    name: 'Lucknow fest',
    text: 'An arts college in Lucknow with 2,000 students holds its two-day fest (a college festival of music, dance and contests), open to all. In this lab, fests like it draw 2 to 3 visitors for each student over the two days.',
    ask: 'How many visitors will come over the two days?',
    range: [4000, 6000],
    step: 500,
    source: WHEEL,
  }),
  item({
    id: 'project-website',
    kind: 'project',
    name: 'Indore website',
    text: 'Your team of three is building a small website for a clinic in Indore: six pages and a form to book a visit. In this lab, jobs like it have taken teams like yours from 4 weeks to 8 weeks.',
    ask: 'How many weeks will your team take?',
    range: [4, 8],
    step: 1,
    source: either('A colleague who has not seen the plan guesses {n}.'),
  }),
  item({
    id: 'project-magazine',
    kind: 'project',
    name: 'Kolkata magazine',
    text: 'Your college society in Kolkata is making its yearly magazine: 60 pages to collect, edit, design and print. In this lab, magazines like it have taken societies from 8 weeks to 12 weeks.',
    ask: 'How many weeks will your society take?',
    range: [8, 12],
    step: 1,
    source: either('A member who has not seen the plan guesses {n}.'),
  }),
];

/** A bare figure, grouped the Indian way for a reader in India: rupees keep their sign. */
export function figure(item: Pick<Item, 'kind'>, n: number, indian: boolean): string {
  const digits = n.toLocaleString(indian ? 'en-IN' : 'en-GB');
  return item.kind === 'rent' ? `₹${digits}` : digits;
}

/** A number as the item says it: rupees, visitors or weeks. */
export function amount(item: Pick<Item, 'kind'>, n: number, indian: boolean): string {
  const bare = figure(item, n, indian);
  if (item.kind === 'rent') return bare;
  return `${bare} ${item.kind === 'fest' ? 'visitor' : 'week'}${n === 1 ? '' : 's'}`;
}

export interface Round {
  item: Item;
  side: Side;
  /** The first number shown before the estimate. */
  anchor: number;
}

/** How far from the value a first number sits: between these multiples of it. */
const FACTOR: Record<Side, [number, number]> = { high: [1.6, 2], low: [0.45, 0.6] };

/**
 * The six items in a random order, each with its first number. One item of
 * each kind gets a high number and the other a low one, chosen at random, at a
 * random distance from the value: always outside the range the item gives.
 */
export function anchorRounds(random: Random): Round[] {
  const rounds = (['rent', 'fest', 'project'] as const).flatMap((kind) => {
    const pair = ITEMS.filter((i) => i.kind === kind);
    const sides: Side[] = random() < 0.5 ? ['high', 'low'] : ['low', 'high'];
    return pair.map((item, k) => {
      const side = sides[k]!;
      const [lo, hi] = FACTOR[side];
      const raw = (item.value * (lo + random() * (hi - lo))) / item.step;
      // Rounded away from the value, so rounding never brings the number back into the range.
      return { item, side, anchor: (side === 'high' ? Math.ceil(raw) : Math.floor(raw)) * item.step };
    });
  });
  return shuffle(rounds, random);
}

/** The first number as its source says it. */
export const firstNumber = ({ item, side, anchor }: Round, indian: boolean): string =>
  item.source[side].replace('{n}', amount(item, anchor, indian)).replace('{f}', figure(item, anchor, indian));

/**
 * How far an estimate moved from the value towards the first number, on a ratio
 * scale: 0 is no move, 1 is all the way to the first number, and below 0 is a
 * move away from it. Capped from -1 to 2, so one slip of a zero cannot swamp the rest.
 */
export function pull(estimate: number, value: number, anchor: number): number {
  const p = Math.log(estimate / value) / Math.log(anchor / value);
  return Math.min(2, Math.max(-1, p));
}

export interface Estimate extends Round {
  estimate: number;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);
/** How far above the value estimates sat, on average, as a fraction (−0.2 is 20% below): a geometric mean, so each item counts alike. */
const above = (rows: Estimate[]) =>
  rows.length ? Math.exp(mean(rows.map((r) => Math.log(r.estimate / r.item.value)))) - 1 : 0;

/** One part's estimates: the average pull, and how far above the value they sat after high and after low first numbers. */
export function summarise(rows: Estimate[]) {
  return {
    pull: mean(rows.map((r) => pull(r.estimate, r.item.value, r.anchor))),
    high: above(rows.filter((r) => r.side === 'high')),
    low: above(rows.filter((r) => r.side === 'low')),
  };
}

/** Whether the pull got smaller or larger after giving reasons; a change of under 0.05 is about the same. */
export function change(before: number, after: number): 'less' | 'more' | 'same' {
  if (Math.abs(after - before) < 0.05) return 'same';
  return after < before ? 'less' : 'more';
}

const pct = (x: number) => `${Math.round(Math.abs(x) * 100)}%`;

/** A pull in words, to follow "you moved". */
export function pullText(p: number): string {
  if (Math.round(p * 100) === 0) return 'not at all towards the first number';
  return p > 0
    ? `${pct(p)} of the way towards the first number`
    : `away from the first number, by ${pct(p)} of the gap`;
}

/** How far above or below the lab's value, in words, such as "20% above the lab's value". */
export const aboveText = (x: number): string =>
  Math.round(x * 100) === 0 ? 'right on the lab’s value' : `${pct(x)} ${x > 0 ? 'above' : 'below'} the lab’s value`;
