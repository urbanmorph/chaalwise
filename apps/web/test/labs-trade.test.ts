import { describe, expect, it } from 'vitest';
import {
  BOTS,
  bestDeal,
  botTurn,
  interests,
  ISSUES,
  MIDDLE,
  NO_DEAL,
  OPENING,
  points,
  ROUNDS,
  YOU,
  YOUR_OFFERS,
  type BotId,
  type Levels,
  type Offer,
  TRADES,
  describe as words,
} from '../src/lib/labs/trade';
import { seeded } from '../src/lib/labs/seeded';

const offer = (salary: number, joining: number, home: number, training: number): Levels => ({
  salary,
  joining,
  home,
  training,
});

/** Play a round with offers made in turn, taking whatever the bot does; the deal, or none. */
function play(bot: BotId, yours: Levels[]): Levels | undefined {
  const offers: Offer[] = [];
  const opening = botTurn(bot, offers);
  if (opening.kind === 'counter') offers.push({ by: 'bot', levels: opening.levels });
  for (const levels of yours) {
    offers.push({ by: 'you', levels });
    const move = botTurn(bot, offers);
    if (move.kind === 'accept') return levels;
    if (move.kind === 'reject') return undefined;
    offers.push({ by: 'bot', levels: move.levels });
  }
  return undefined;
}

const scores = (bot: BotId, deal: Levels | undefined) => (deal ? points(bot, deal) : NO_DEAL);

describe('trade what matters less', () => {
  it('negotiates a job offer over four issues, each with five options, against two bots in turn', () => {
    expect(ISSUES.map((i) => i.id)).toEqual(['salary', 'joining', 'home', 'training']);
    for (const issue of ISSUES) expect(issue.levels).toHaveLength(5);
    expect(ROUNDS).toEqual(['meera', 'rajan']);
    expect(YOUR_OFFERS).toBe(3);
  });

  it('gives each side up to 100 points, and each side cares about the issues differently', () => {
    const best = offer(4, 4, 4, 4);
    const worst = offer(0, 0, 0, 0);
    for (const bot of ROUNDS) {
      expect(points(bot, best)).toEqual({ you: 100, them: 0 });
      expect(points(bot, worst)).toEqual({ you: 0, them: 100 });
    }
    // You care most about salary; Meera about the joining date; Rajan about cost, the training budget most.
    expect(interests(YOU)).toEqual({ most: 'salary', least: 'joining' });
    expect(interests(BOTS.meera.sheet)).toEqual({ most: 'joining', least: 'training' });
    expect(interests(BOTS.rajan.sheet)).toEqual({ most: 'training', least: 'home' });
  });

  it('splitting every issue down the middle gives 50 each, 100 in all: less than the best deal', () => {
    for (const bot of ROUNDS) expect(points(bot, MIDDLE)).toEqual({ you: 50, them: 50 });
    // The best deal gives each issue to the side it is worth more to.
    expect(bestDeal('meera')).toEqual({ levels: offer(4, 0, 4, 4), total: 136 });
    expect(bestDeal('rajan')).toEqual({ levels: offer(4, 0, 4, 0), total: 128 });
  });

  it('says an offer in words', () => {
    expect(words(TRADES.meera)).toBe(
      'pay in the middle of the band, join in 1 week, 4 days a week at home, a certificate course and a conference',
    );
  });

  it('no deal at all gives each side 40', () => {
    expect(NO_DEAL).toEqual({ you: 40, them: 40 });
  });

  it('opens by offering you little on every issue', () => {
    for (const bot of ROUNDS) {
      expect(botTurn(bot, [])).toEqual({ kind: 'counter', levels: OPENING });
      expect(points(bot, OPENING)).toEqual({ you: 25, them: 75 });
    }
  });

  it('haggling issue by issue, down to the middle, ends at 50 each', () => {
    const haggle = [offer(4, 4, 4, 4), offer(3, 3, 3, 3), MIDDLE];
    for (const bot of ROUNDS) {
      const deal = play(bot, haggle);
      expect(deal, bot).toEqual(MIDDLE);
      expect(scores(bot, deal)).toEqual({ you: 50, them: 50 });
    }
  });

  it('the bot bargains by positions: its counters meet you a step at a time on every issue, never trading', () => {
    const offers: Offer[] = [
      { by: 'bot', levels: OPENING },
      { by: 'you', levels: offer(4, 4, 4, 4) },
    ];
    expect(botTurn('meera', offers)).toEqual({ kind: 'counter', levels: offer(2, 2, 2, 2) });
    // It takes what you give: offer it the earliest date and it keeps it, still meeting you a step elsewhere.
    const given: Offer[] = [
      { by: 'bot', levels: OPENING },
      { by: 'you', levels: offer(4, 0, 4, 4) },
    ];
    expect(botTurn('meera', given)).toEqual({ kind: 'counter', levels: offer(2, 0, 2, 2) });
  });

  it('asking what they care about, then trading for it, beats haggling for both sides against both bots', () => {
    // Give Meera the date she cares about most, keep what you care about; then meet her on salary.
    const meera = play('meera', [offer(4, 0, 4, 4), TRADES.meera]);
    expect(TRADES.meera).toEqual(offer(2, 0, 4, 4));
    expect(scores('meera', meera)).toEqual({ you: 68, them: 60 });
    // Give Rajan the training budget he watches, keep the days at home you care about more; then meet him on salary and date.
    const rajan = play('rajan', [offer(4, 4, 4, 0), TRADES.rajan]);
    expect(TRADES.rajan).toEqual(offer(3, 2, 4, 0));
    expect(scores('rajan', rajan)).toEqual({ you: 64, them: 58 });
    for (const [bot, deal] of [
      ['meera', meera],
      ['rajan', rajan],
    ] as const) {
      const s = scores(bot, deal);
      expect(s.you).toBeGreaterThan(50);
      expect(s.them).toBeGreaterThan(50);
    }
  });

  it('simulated learners who trade end with more, for themselves and in all, than those who split or offer at random', () => {
    const r = seeded(21);
    const level = () => Math.floor(r() * 5);
    for (const bot of ROUNDS) {
      const { most } = interests(BOTS[bot].sheet);
      // Trader: concede their top issue fully, ask the top on the rest, then come down on salary a step at a time.
      const give = (salary: number): Levels => ({ ...offer(salary, 4, 4, 4), [most]: 0 });
      const trader = scores(bot, play(bot, [give(4), give(3), give(2)]));
      const splitter = scores(bot, play(bot, [offer(4, 4, 4, 4), offer(3, 3, 3, 3), MIDDLE]));
      let you = 0;
      let total = 0;
      const n = 3000;
      for (let i = 0; i < n; i++) {
        const s = scores(
          bot,
          play(
            bot,
            [0, 1, 2].map(() => offer(level(), level(), level(), level())),
          ),
        );
        you += s.you / n;
        total += (s.you + s.them) / n;
      }
      expect(trader.you, bot).toBeGreaterThan(splitter.you);
      expect(trader.you + trader.them, bot).toBeGreaterThan(splitter.you + splitter.them);
      expect(trader.you, bot).toBeGreaterThan(you);
      expect(trader.you + trader.them, bot).toBeGreaterThan(total);
    }
  });

  it('never accepts or counters with less than half its points, and answers your last offer with yes or no', () => {
    const r = seeded(5);
    const level = () => Math.floor(r() * 5);
    for (let n = 0; n < 4000; n++) {
      const bot = ROUNDS[n % 2]!;
      const offers: Offer[] = [];
      const opening = botTurn(bot, offers);
      if (opening.kind === 'counter') offers.push({ by: 'bot', levels: opening.levels });
      for (let k = 0; k < YOUR_OFFERS; k++) {
        const levels = offer(level(), level(), level(), level());
        offers.push({ by: 'you', levels });
        const move = botTurn(bot, offers);
        if (move.kind === 'accept') expect(points(bot, levels).them).toBeGreaterThanOrEqual(50);
        if (k === YOUR_OFFERS - 1) expect(move.kind).not.toBe('counter');
        if (move.kind !== 'counter') break;
        expect(points(bot, move.levels).them).toBeGreaterThanOrEqual(50);
        offers.push({ by: 'bot', levels: move.levels });
      }
    }
  });

  it('accepts less as the talks go on: a good trade at once, the middle only at the end', () => {
    const at = (bot: BotId, levels: Levels, k: number) => {
      const offers: Offer[] = [{ by: 'bot', levels: OPENING }];
      for (let i = 0; i < k; i++) offers.push({ by: 'you', levels: offer(4, 4, 4, 4) }, { by: 'bot', levels: OPENING });
      offers.push({ by: 'you', levels });
      return botTurn(bot, offers).kind;
    };
    expect(at('meera', MIDDLE, 0)).toBe('counter');
    expect(at('meera', MIDDLE, 2)).toBe('accept');
    expect(at('meera', offer(1, 0, 4, 4), 0)).toBe('accept');
  });
});
