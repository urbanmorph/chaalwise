import { between, type Random } from './seeded';

/**
 * The bonus rule, after Kerr's "On the folly of rewarding A, while hoping for
 * B" (1975): the learner sets a support team's bonus each week, and four bots
 * do whatever scores best under it. What the learner wants is customers'
 * problems solved; what they get is whatever the rule pays for.
 */

/** Four bots, 40 hours each. */
export const TEAM_HOURS = 160;
export const WEEKS = 4;
/** New problems a week, on average: more than the team can fix properly (40), so time is short. */
export const DEMAND = 48;
/** Hours a proper fix takes; a quick reply takes 1, splitting off or turning away half an hour. */
const FIX = 4;
/** A help page takes 8 hours and heads off 2 problems a week from the next week on. Only 8 common questions are worth one, 4 a week at most. */
const PAGE = { hours: 8, heads: 2, topics: 8, perWeek: 4 };
/** With no bonus, the bots fix problems at a steady pace: 30 hours of the 40. */
const STEADY = 0.75;

export const RULES = {
  closed: { short: 'Per ticket closed', text: 'A bonus for each ticket closed', measure: 'tickets closed' },
  hours: { short: 'Per hour logged', text: 'A bonus for each hour logged on tickets', measure: 'hours logged' },
  fewer: {
    short: 'Fewer tickets',
    text: `A bonus for each ticket fewer than ${DEMAND} logged in the week`,
    measure: 'fewer tickets',
  },
  flat: { short: 'No bonus', text: 'No bonus: steady pay', measure: '' },
  solved: {
    short: 'Per problem solved',
    text: 'A bonus for each problem still solved a month later',
    measure: 'problems solved',
  },
  prevented: {
    short: 'Solved or prevented',
    text: 'A bonus for each problem still solved a month later, and each repeat question a help page prevents',
    measure: 'problems solved or prevented',
  },
} satisfies Record<string, { short: string; text: string; measure: string }>;

export type RuleId = keyof typeof RULES;

/** What carries from one week to the next. */
export interface TeamState {
  /** Problems logged but not yet worked. */
  backlog: number;
  /** Problems closed with a quick reply last week, back again. */
  reopened: number;
  /** Help pages written so far. */
  pages: number;
}

export const START: TeamState = { backlog: 0, reopened: 0, pages: 0 };

export interface Week {
  rule: RuleId;
  /** New problems that reached the team, after the help pages headed some off. */
  arrived: number;
  /** Problems headed off by help pages. */
  prevented: number;
  /** Customers turned away before their problem was logged. */
  turnedAway: number;
  /** Tickets logged this week: new ones not turned away, and reopened ones. */
  logged: number;
  /** Problems waiting at the start of the week's work. */
  queue: number;
  fixed: number;
  /** Closed with a quick reply that does not solve the problem; it comes back. */
  rushed: number;
  /** Extra tickets split off a problem and closed, to be counted again. */
  split: number;
  /** Help pages written this week. */
  pages: number;
  /** What the learner wanted: problems solved or headed off. */
  helped: number;
  after: TeamState;
}

/** The week's new problems: about DEMAND, give or take 3. */
export const drawDemand = (random: Random): number[] =>
  Array.from({ length: WEEKS }, () => DEMAND + between(-3, 3, random));

/** What the bots did: the cheapest way to score under the rule, given the queue. */
function work(rule: RuleId, queue: number, arrived: number, backlog: number, topicsLeft: number) {
  const none = { fixed: 0, rushed: 0, split: 0, turnedAway: 0, pages: 0 };
  switch (rule) {
    case 'closed': {
      // A quick reply (1 hour) and two extra tickets split off (half an hour each): three closed for 2 hours.
      const rushed = Math.min(queue, TEAM_HOURS / 2);
      return { ...none, rushed, split: rushed * 2 };
    }
    case 'hours':
      // Every hour logged pays the same, so each fix stretches to fill the time.
      return { ...none, fixed: Math.min(queue, TEAM_HOURS / (FIX * 2)) };
    case 'fewer': {
      // Turning a customer away (half an hour) is the cheapest ticket not logged; the rest of the time goes at a steady pace on the backlog.
      const left = TEAM_HOURS - arrived / 2;
      return { ...none, turnedAway: arrived, fixed: Math.min(backlog, Math.floor((left * STEADY) / FIX)) };
    }
    case 'flat':
      return { ...none, fixed: Math.min(queue, Math.floor((TEAM_HOURS * STEADY) / FIX)) };
    case 'solved':
      return { ...none, fixed: Math.min(queue, TEAM_HOURS / FIX) };
    case 'prevented': {
      // A page heads off 2 problems a week for a month, 8 in all, for 8 hours: it pays twice what a fix does.
      const pages = Math.min(PAGE.perWeek, topicsLeft);
      return { ...none, pages, fixed: Math.min(queue, Math.floor((TEAM_HOURS - pages * PAGE.hours) / FIX)) };
    }
  }
}

/** One week under a rule, with this many new problems. */
export function playWeek(state: TeamState, rule: RuleId, demand: number): { week: Week; state: TeamState } {
  const prevented = Math.min(demand, state.pages * PAGE.heads);
  const arrived = demand - prevented;
  const waiting = state.backlog + state.reopened;
  const done = work(rule, waiting + arrived, arrived, waiting, PAGE.topics - state.pages);
  const queue = waiting + arrived - done.turnedAway;
  const after = {
    backlog: queue - done.fixed - done.rushed,
    reopened: done.rushed,
    pages: state.pages + done.pages,
  };
  const week = {
    rule,
    arrived,
    prevented,
    logged: arrived - done.turnedAway + state.reopened,
    queue,
    ...done,
    helped: done.fixed + prevented,
    after,
  };
  return { week, state: after };
}

/** The number the rule pays on: what the team was rewarded for. */
export function paidFor(w: Week): number {
  switch (w.rule) {
    case 'closed':
      return w.fixed + w.rushed + w.split;
    case 'hours':
      return TEAM_HOURS;
    case 'fewer':
      return Math.max(0, DEMAND - w.logged);
    case 'flat':
      return 0;
    case 'solved':
      return w.fixed;
    case 'prevented':
      return w.fixed + w.prevented;
  }
}

/** Every week under one rule, from the start. */
export function holdRule(rule: RuleId, demand: number[]): Week[] {
  let state = START;
  return demand.map((d) => {
    const played = playWeek(state, rule, d);
    state = played.state;
    return played.week;
  });
}
