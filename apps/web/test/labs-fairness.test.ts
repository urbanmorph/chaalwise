import { describe, expect, it } from 'vitest';
import {
  acceptRate,
  accepts,
  averageKept,
  bestOffer,
  CROWD,
  FIRST_SEND,
  GROWTH,
  nextSend,
  PIE,
  playReturns,
  RECEIVERS,
  RESPONDERS,
  RETURN_ROUNDS,
  SEND_ROUNDS,
  sendResult,
  SHOWN_OFFERS,
  STAKE,
} from '../src/lib/labs/fairness';

describe('split it fairly: the ultimatum game', () => {
  it('splits 100 points; four responders, each with a name, a manner and a limit below which they say no', () => {
    expect(PIE).toBe(100);
    expect(RESPONDERS.map((r) => r.name)).toEqual(['Arjun', 'Kavya', 'Priya', 'Kabir']);
    for (const r of RESPONDERS) expect(r.about).toBeTruthy();
    const limits = RESPONDERS.map((r) => r.limit);
    expect(limits).toEqual([...limits].sort((a, b) => a - b));
    expect(new Set(limits).size).toBe(4);
  });

  it('a responder accepts an offer at or above its limit; if it says no, both get nothing', () => {
    expect(accepts(20, 20)).toBe(true);
    expect(accepts(20, 19)).toBe(false);
  });

  it('pure maths says offer 1: someone who counts only points takes anything over nothing, so 1 keeps the most', () => {
    expect(RESPONDERS[0]!.limit).toBe(1);
    expect(accepts(1, 0)).toBe(false);
    expect(bestOffer([1])).toBe(1);
    expect(averageKept(1, [1])).toBe(99);
  });

  it('the crowd of 20 is set near published results: half say no below 20, nearly all accept 40', () => {
    expect(CROWD).toHaveLength(20);
    expect(acceptRate(5)).toBe(0.25);
    expect(acceptRate(15)).toBe(0.5);
    expect(acceptRate(40)).toBe(0.9);
    expect(acceptRate(50)).toBe(1);
  });

  it('against the crowd, offering 1 keeps about 25 on average, 30 keeps the most, 56, and an even split 50', () => {
    expect(averageKept(1)).toBeCloseTo(24.75);
    expect(bestOffer()).toBe(30);
    expect(averageKept(30)).toBe(56);
    expect(averageKept(50)).toBe(50);
    expect(SHOWN_OFFERS).toContain(bestOffer());
    expect(SHOWN_OFFERS[0]).toBe(1);
  });
});

describe('split it fairly: the trust game, sending', () => {
  it('each round you hold 10 points; what you send is tripled, and the partner decides what to send back', () => {
    expect([STAKE, GROWTH]).toEqual([10, 3]);
    expect(sendResult('vikram', 4)).toEqual({ sent: 4, got: 12, back: 0, you: 6, them: 12 });
  });

  it('meets Meera and Vikram twice each, in turn, so the second time you know their record', () => {
    expect(RECEIVERS.map((r) => r.name)).toEqual(['Meera', 'Vikram']);
    expect(SEND_ROUNDS).toEqual(['meera', 'vikram', 'meera', 'vikram']);
  });

  it('Meera, a reciprocator, sends back half of what reaches her (rounded down), never less than you sent; Vikram, a keeper, sends back nothing', () => {
    for (let sent = 1; sent <= STAKE; sent++) {
      const m = sendResult('meera', sent);
      expect(m.back).toBe(Math.floor((sent * GROWTH) / 2));
      expect(m.back).toBeGreaterThanOrEqual(sent);
      expect(sendResult('vikram', sent).back).toBe(0);
    }
  });

  it('trusting Meera with all 10 pays most (15); with Vikram, sending nothing does (10)', () => {
    const best = (id: 'meera' | 'vikram') =>
      Array.from({ length: STAKE + 1 }, (_, s) => sendResult(id, s)).reduce((a, b) => (b.you > a.you ? b : a));
    expect(best('meera')).toMatchObject({ sent: 10, you: 15 });
    expect(best('vikram')).toMatchObject({ sent: 0, you: 10 });
  });

  it('trust grows the pie: together you end with 10 plus twice what you sent', () => {
    for (const id of ['meera', 'vikram'] as const)
      for (let s = 0; s <= STAKE; s++) {
        const r = sendResult(id, s);
        expect(r.you + r.them).toBe(STAKE + 2 * s);
      }
  });
});

describe('split it fairly: the trust game, sending back', () => {
  it('Neha sends 5 first; more after you send back more than she sent, less after less, never under 1', () => {
    expect(FIRST_SEND).toBe(5);
    expect(nextSend(5, 8)).toBe(10);
    expect(nextSend(10, 30)).toBe(10);
    expect(nextSend(5, 5)).toBe(5);
    expect(nextSend(5, 0)).toBe(2);
    expect(nextSend(1, 0)).toBe(1);
  });

  it('plays four rounds, each sending what the last answer earned', () => {
    const rounds = playReturns(() => 0);
    expect(rounds).toHaveLength(RETURN_ROUNDS);
    expect(rounds.map((r) => r.sent)).toEqual([5, 2, 1, 1]);
  });

  const total = (policy: Parameters<typeof playReturns>[0]) => playReturns(policy).reduce((s, r) => s + r.kept, 0);
  const half = (got: number) => Math.ceil(got / 2);

  it('when you will meet again, sending back half earns more (52) than sending back what she sent (40) or keeping all (27)', () => {
    expect(total(half)).toBe(52);
    expect(total((got) => got / GROWTH)).toBe(40);
    expect(total(() => 0)).toBe(27);
  });

  it('in the last round, with no next time, keeping all pays more still (67): only fairness holds a person back', () => {
    expect(total((got, round) => (round === RETURN_ROUNDS ? 0 : half(got)))).toBe(67);
  });
});
