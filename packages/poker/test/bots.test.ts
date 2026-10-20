import { describe, expect, it } from 'vitest';
import { deck, shuffle, type Card } from '../src/cards';
import { botMove, playBots, startingScore, STYLES, type Style } from '../src/bots';
import { seeded } from '../src/random';
import { act, legalMoves, newHand, stackDeck, type Table } from '../src/table';

const c = (text: string) => text.split(' ') as Card[];
const bots = (n: number) => Array.from({ length: n }, (_, i) => ({ name: `Bot ${i}`, points: 200, isBot: true }));

describe('starting-hand score', () => {
  it('ranks big pairs over small, and suited connectors over ragged hands', () => {
    expect(startingScore(c('As Ad'))).toBeGreaterThan(startingScore(c('7s 7d')));
    expect(startingScore(c('Ts Td'))).toBeGreaterThan(startingScore(c('9h 8h')));
    expect(startingScore(c('9h 8h'))).toBeGreaterThan(startingScore(c('9h 8d')));
    expect(startingScore(c('9h 8d'))).toBeGreaterThan(startingScore(c('7c 2d')));
    expect(startingScore(c('Ah Kh'))).toBeGreaterThan(startingScore(c('Jh Td')));
  });
});

describe('bot moves', () => {
  it('always choose a legal move, for every style, across many hands', () => {
    for (let seed = 1; seed <= 150; seed++) {
      const random = seeded(seed);
      const n = 2 + (seed % 3);
      let t = newHand(bots(n), seed % n, shuffle(deck(), random));
      while (!t.result) {
        const style = STYLES[(t.toAct + seed) % STYLES.length]!;
        const move = botMove(t, t.toAct, style, random);
        expect(legalMoves(t)).toContain(move);
        t = act(t, move);
      }
    }
  });

  it('a cautious bot folds seven-two offsuit to a bet before the flop', () => {
    const cards = stackDeck([c('As Ks'), c('Qd Qc'), c('7c 2d')], c('3c 4d 9h Js 5s'), 1);
    // Dealer 1: small blind seat 2, big blind seat 0, seat 1 acts first and raises.
    let u = act(newHand(bots(3), 1, cards), 'raise');
    expect(u.toAct).toBe(2);
    for (let seed = 1; seed <= 50; seed++) expect(botMove(u, 2, 'cautious', seeded(seed))).toBe('fold');
    u = act(u, 'fold');
    expect(u.seats[2]!.folded).toBe(true);
  });

  it('every style bets or raises with a full house', () => {
    const cards = stackDeck([c('Kh Kd'), c('7c 2d')], c('Ks 9c 9d 3h 4s'), 0);
    let t = newHand(bots(2), 0, cards);
    t = act(act(t, 'call'), 'check');
    expect(t.street).toBe('flop');
    for (const style of STYLES) {
      for (let seed = 1; seed <= 30; seed++) {
        // Seat 1 acts first on the flop; seat 0, the dealer, has the full house.
        const afterCheck = act(t, 'check');
        expect(botMove(afterCheck, 0, style, seeded(seed))).toBe('bet');
        const afterBet = act(t, 'bet');
        expect(botMove(afterBet, 0, style, seeded(seed))).toBe('raise');
      }
    }
  });

  it('a bold bot bets and raises more often than a cautious one', () => {
    const aggression = (style: Style) => {
      let aggressive = 0;
      let moves = 0;
      for (let seed = 1; seed <= 150; seed++) {
        const random = seeded(seed);
        let t: Table = newHand(bots(3), seed % 3, shuffle(deck(), random));
        while (!t.result) {
          const move = botMove(t, t.toAct, style, random);
          if (move === 'bet' || move === 'raise') aggressive++;
          moves++;
          t = act(t, move);
        }
      }
      return aggressive / moves;
    };
    expect(aggression('bold')).toBeGreaterThan(aggression('steady'));
    expect(aggression('steady')).toBeGreaterThan(aggression('cautious'));
  });

  it('plays the bots until it is a person’s turn or the hand ends', () => {
    const seats = [{ name: 'You', points: 200, isBot: false }, ...bots(4).slice(1)];
    const styles: Style[] = ['steady', 'cautious', 'steady', 'bold'];
    for (let seed = 1; seed <= 50; seed++) {
      const random = seeded(seed);
      const t = playBots(newHand(seats, seed % 4, shuffle(deck(), random)), styles, random);
      expect(t.result !== undefined || !t.seats[t.toAct]!.isBot).toBe(true);
    }
  });
});
