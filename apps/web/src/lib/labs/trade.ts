/**
 * Trade what matters less: a job offer negotiated over four issues at once,
 * after Raiffa's scoring-sheet negotiations (The Art and Science of
 * Negotiation, 1982) and Fisher and Ury's interests, not positions (Getting to
 * Yes, 1981). Each side has its own scoring sheet; you see only yours. The bots
 * bargain by positions: they meet you a step at a time on every issue and never
 * propose a trade, so splitting the difference is where haggling ends. The
 * sheets and the bots' thresholds are this lab's design, not data.
 */

export type Issue = 'salary' | 'joining' | 'home' | 'training';

/** The issues, each with five options from the one best for the firm (0) to the one best for you (4). */
export const ISSUES: { id: Issue; name: string; levels: string[] }[] = [
  {
    id: 'salary',
    name: 'Salary',
    levels: [
      'pay at the bottom of the band',
      'pay low in the band',
      'pay in the middle of the band',
      'pay high in the band',
      'pay at the top of the band',
    ],
  },
  {
    id: 'joining',
    name: 'Joining date',
    levels: ['join in 1 week', 'join in 2 weeks', 'join in 4 weeks', 'join in 6 weeks', 'join in 8 weeks'],
  },
  {
    id: 'home',
    name: 'Work from home',
    levels: [
      'no days at home',
      '1 day a week at home',
      '2 days a week at home',
      '3 days a week at home',
      '4 days a week at home',
    ],
  },
  {
    id: 'training',
    name: 'Training budget',
    levels: [
      'no training budget',
      'one short course',
      'two short courses',
      'a certificate course',
      'a certificate course and a conference',
    ],
  },
];

/** The top option on each issue. */
export const TOP = 4;

/** An offer: the option on each issue, 0 to 4. */
export type Levels = Record<Issue, number>;

/** A scoring sheet: what each issue is worth to a side when it gets its way in full; the four add up to 100. */
export type Sheet = Record<Issue, number>;

export const YOU: Sheet = { salary: 40, home: 28, training: 20, joining: 12 };

export type BotId = 'meera' | 'rajan';

export const BOTS: Record<BotId, { name: string; about: string; sheet: Sheet; answer: string }> = {
  meera: {
    name: 'Meera',
    about: 'Hiring manager at a start-up whose new project starts this month.',
    sheet: { joining: 48, salary: 24, home: 16, training: 12 },
    answer:
      'Meera says: “Our project starts this month, so we need you here soon: the joining date matters most to us. The training budget matters least.”',
  },
  rajan: {
    name: 'Rajan',
    about: 'Team lead at a large firm whose team budget is tight this year.',
    sheet: { training: 40, salary: 32, joining: 20, home: 8 },
    answer:
      'Rajan says: “Every cost comes out of my team’s budget, and training most of all, so the training budget matters most to us. Days at home cost us almost nothing.”',
  },
};

/** The bots you negotiate with, in turn. */
export const ROUNDS: BotId[] = ['meera', 'rajan'];

/** Offers you can make in a round; the bot accepts or turns down your last one. */
export const YOUR_OFFERS = 3;

/** The points each side gets with no deal: you stay where you are, and the firm hires someone else. */
export const NO_DEAL = { you: 40, them: 40 };

/** Every issue split down the middle. */
export const MIDDLE: Levels = { salary: 2, joining: 2, home: 2, training: 2 };

/** A trade each bot accepts at your second offer: it gets the issue it cares most about, you get what you care about more. */
export const TRADES: Record<BotId, Levels> = {
  meera: { salary: 2, joining: 0, home: 4, training: 4 },
  rajan: { salary: 3, joining: 2, home: 4, training: 0 },
};

/** The bot's first offer: a little for you on every issue. */
export const OPENING: Levels = { salary: 1, joining: 1, home: 1, training: 1 };

/** The least the bot accepts, by your offer: 1st, 2nd, last. It never offers itself less than the last. */
const ACCEPTS = [66, 58, 50];

const ids = ISSUES.map((i) => i.id);

/** A side's points for an offer: its share of each issue's worth to it. */
const score = (sheet: Sheet, levels: Levels, mine: boolean) =>
  ids.reduce((s, id) => s + (sheet[id] * (mine ? levels[id] : TOP - levels[id])) / TOP, 0);

/** What an offer is worth to you and to the bot. */
export const points = (bot: BotId, levels: Levels) => ({
  you: score(YOU, levels, true),
  them: score(BOTS[bot].sheet, levels, false),
});

/** An offer in words, such as "pay in the middle of the band, join in 1 week, …". */
export const describe = (levels: Levels) => ISSUES.map((i) => i.levels[levels[i.id]]).join(', ');

/** The issues a sheet values most and least: what a side says when asked what matters to it. */
export function interests(sheet: Sheet): { most: Issue; least: Issue } {
  const sorted = [...ids].sort((a, b) => sheet[b] - sheet[a]);
  return { most: sorted[0]!, least: sorted.at(-1)! };
}

/** The deal with the most points in all: each issue goes to the side it is worth more to. */
export function bestDeal(bot: BotId): { levels: Levels; total: number } {
  const theirs = BOTS[bot].sheet;
  const levels = Object.fromEntries(ids.map((id) => [id, YOU[id] > theirs[id] ? TOP : 0])) as Levels;
  const p = points(bot, levels);
  return { levels, total: p.you + p.them };
}

export interface Offer {
  by: 'you' | 'bot';
  levels: Levels;
}

export type BotMove = { kind: 'accept' } | { kind: 'reject' } | { kind: 'counter'; levels: Levels };

/**
 * The bot's move, given the offers so far: open, accept your last offer if it
 * gives the bot enough for this point in the talks, turn down your last one,
 * or counter by moving its own last offer a step towards yours on every issue.
 * It keeps a step it cannot afford, starting with the issue it cares most about.
 */
export function botTurn(bot: BotId, offers: readonly Offer[]): BotMove {
  const yours = offers.filter((o) => o.by === 'you');
  const last = yours.at(-1);
  if (!last) return { kind: 'counter', levels: OPENING };
  const k = yours.length - 1;
  if (points(bot, last.levels).them >= ACCEPTS[k]!) return { kind: 'accept' };
  if (yours.length >= YOUR_OFFERS) return { kind: 'reject' };
  const own = offers.findLast((o) => o.by === 'bot')?.levels ?? OPENING;
  const levels = { ...own };
  for (const id of ids) levels[id] += Math.sign(last.levels[id] - own[id]);
  const floor = ACCEPTS.at(-1)!;
  const sheet = BOTS[bot].sheet;
  for (const id of [...ids].sort((a, b) => sheet[b] - sheet[a])) {
    if (points(bot, levels).them >= floor) break;
    levels[id] = own[id];
  }
  return { kind: 'counter', levels };
}
