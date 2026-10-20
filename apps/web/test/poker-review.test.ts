import { seeded } from '@chaalwise/poker/random';
import { act, newHand, stackDeck, STARTING_POINTS, type Table } from '@chaalwise/poker/table';
import { describe, expect, it } from 'vitest';
import { advise, review, suggestion } from '../src/lib/poker/review';

const players = [
  { name: 'You', points: STARTING_POINTS, isBot: false },
  { name: 'Bot', points: STARTING_POINTS, isBot: true },
];

describe('what the maths suggests at a decision', () => {
  it('folds when the chance of winning is below the price of the call', () => {
    expect(suggestion({ equity: 15, toCall: 4, pot: 12, moves: ['fold', 'call', 'raise'] }).suggest).toBe('fold');
  });

  it('calls when the chance is above the price, and raises only a strong hand', () => {
    expect(suggestion({ equity: 40, toCall: 4, pot: 12, moves: ['fold', 'call', 'raise'] }).suggest).toBe('call');
    expect(suggestion({ equity: 75, toCall: 4, pot: 12, moves: ['fold', 'call', 'raise'] }).suggest).toBe('raise');
    expect(suggestion({ equity: 75, toCall: 4, pot: 12, moves: ['fold', 'call'] }).suggest).toBe('call');
  });

  it('bets a strong hand when nobody has bet, and checks the rest for free', () => {
    expect(suggestion({ equity: 70, toCall: 0, pot: 8, moves: ['check', 'bet'] }).suggest).toBe('bet');
    expect(suggestion({ equity: 30, toCall: 0, pot: 8, moves: ['check', 'bet'] }).suggest).toBe('check');
  });

  it('says why in numbers: the chance, and the price as a share of the pot after the call', () => {
    const { why, price } = suggestion({ equity: 15, toCall: 4, pot: 12, moves: ['fold', 'call', 'raise'] });
    expect(price).toBe(25);
    expect(why).toMatch(/15%/);
    expect(why).toMatch(/25%/);
  });
});

describe('advice at the table', () => {
  const river = (): Table => {
    // You hold three-two; the board gives you nothing. Heads-up, you are the dealer: first to act before the flop, last after it.
    let t = newHand(
      players,
      0,
      stackDeck(
        [
          ['3c', '2d'],
          ['Ah', 'Kd'],
        ],
        ['As', 'Kh', '9s', '8d', '5c'],
        0,
      ),
    );
    for (const move of ['call', 'check'] as const) t = act(t, move);
    for (let street = 0; street < 2; street++) for (const move of ['check', 'check'] as const) t = act(t, move);
    // On the river the bot checks; you decide.
    return act(t, 'check');
  };

  it('works out the chance against any two cards at the moment of the decision', () => {
    const t = river();
    expect(t.street).toBe('river');
    const advice = advise(t, seeded(1));
    expect(advice.equity).toBeLessThan(20);
    expect(advice.suggest).toBe('check');
  });

  it('reviews each decision: what you did, the odds then, and whether it matched the maths', () => {
    const t = river();
    const decision = review(t, 'bet', seeded(1));
    expect(decision).toMatchObject({ street: 'river', move: 'bet', suggest: 'check', agreed: false });
  });
});

describe('the advice shown before a decision', () => {
  it('is the advice the review keeps, so the numbers never change between the two', () => {
    const shown = { equity: 46, price: 25, suggest: 'call' as const, why: 'shown' };
    const table = newHand(
      players,
      0,
      stackDeck(
        [
          ['Td', '8c'],
          ['Ah', 'Kd'],
        ],
        ['As', 'Kh', '9s', '8d', '5c'],
        0,
      ),
    );
    expect(review(table, 'call', seeded(1), shown)).toMatchObject({
      equity: 46,
      why: 'shown',
      agreed: true,
      street: 'preflop',
    });
  });
});
