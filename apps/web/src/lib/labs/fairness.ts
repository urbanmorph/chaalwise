/**
 * Split it fairly: the ultimatum game (Güth, Schmittberger and Schwarze 1982)
 * and the trust game (Berg, Dickhaut and McCabe 1995).
 *
 * In the ultimatum game the learner offers a share of 100 points; the bot takes
 * it or says no, and then neither side gets anything. Counting points alone, a
 * responder takes any offer over nothing. People do not: the crowd's limits are
 * this lab's design, set near what studies found (Camerer 2003): offers under
 * 20 per cent are turned down about half the time, and most offers are 40 to 50.
 *
 * In the trust game what is sent is tripled, and the partner decides what to
 * send back. The learner sends to a reciprocator and a keeper, twice each, then
 * sends back to a bot who trusts more after fair treatment and less after unfair.
 */

import { PIE } from './split';

/** The points to split: the same 100 as in Split the pie. */
export { PIE };

export interface Responder {
  name: string;
  /** Completes a sentence that starts with the name. */
  about: string;
  /** The smallest offer it accepts. */
  limit: number;
}

export const RESPONDERS: Responder[] = [
  { name: 'Arjun', about: 'counts only points: something, he says, is better than nothing.', limit: 1 },
  { name: 'Kavya', about: 'is easy-going, but does not like being taken for a fool.', limit: 20 },
  { name: 'Priya', about: 'cares about being treated fairly, and will pay to show it.', limit: 35 },
  { name: 'Kabir', about: 'is proud: he expects an even split from a partner.', limit: 50 },
];

/** Whether a responder with this limit takes the offer. If it says no, both sides get nothing. */
export const accepts = (limit: number, offer: number): boolean => offer >= limit;

/** The limits of a crowd of 20 bots, set near published results. */
export const CROWD = [1, 1, 1, 1, 1, 10, 10, 10, 10, 10, 20, 20, 20, 30, 30, 30, 40, 40, 50, 50];

/** The share of a crowd that accepts an offer. */
export const acceptRate = (offer: number, limits: readonly number[] = CROWD): number =>
  limits.filter((l) => accepts(l, offer)).length / limits.length;

/** The points you keep on average by offering this much to each of a crowd. */
export const averageKept = (offer: number, limits: readonly number[] = CROWD): number =>
  (PIE - offer) * acceptRate(offer, limits);

/** The offer that keeps the most on average (the smallest, if two tie). */
export function bestOffer(limits: readonly number[] = CROWD): number {
  let best = 0;
  for (let offer = 1; offer <= PIE; offer++) if (averageKept(offer, limits) > averageKept(best, limits)) best = offer;
  return best;
}

/** The offers the debrief compares. */
export const SHOWN_OFFERS = [1, 10, 20, 30, 40, 50];

/** Points you hold in each round of the trust game, and what each point sent becomes. */
export const STAKE = 10;
export const GROWTH = 3;

export type ReceiverId = 'meera' | 'vikram';

/** The partners you send to; `about` completes a sentence that starts with the name. */
export const RECEIVERS: { id: ReceiverId; name: string; about: string; back: (got: number) => number }[] = [
  { id: 'meera', name: 'Meera', about: 'runs the juice stall across the lane.', back: (got) => Math.floor(got / 2) },
  { id: 'vikram', name: 'Vikram', about: 'runs the snack stall at the corner.', back: () => 0 },
];

/** Whom you send to in each round: each partner twice, in turn. */
export const SEND_ROUNDS: ReceiverId[] = ['meera', 'vikram', 'meera', 'vikram'];

/** One round of sending: what reached the partner, what came back, and what each side ends with. */
export function sendResult(id: ReceiverId, sent: number) {
  const got = sent * GROWTH;
  const back = RECEIVERS.find((r) => r.id === id)!.back(got);
  return { sent, got, back, you: STAKE - sent + back, them: got - back };
}

/** The sender in the last part, whom you answer. */
export const NEHA = {
  name: 'Neha',
  about:
    'She starts by sending you half her points. If you send back more than she sent, she sends more next time; if less, she sends less.',
};

export const RETURN_ROUNDS = 4;
export const FIRST_SEND = 5;

/** What Neha sends next: 5 more after she gained, half as much after she lost, never under 1 (she always tests you a little). */
export const nextSend = (sent: number, returned: number): number =>
  returned > sent ? Math.min(STAKE, sent + 5) : returned < sent ? Math.max(1, Math.floor(sent / 2)) : sent;

/** Four rounds as the one who sends back, with `back` choosing from what reached you, in round 1 to 4. */
export function playReturns(back: (got: number, round: number) => number) {
  const rounds: { sent: number; got: number; back: number; kept: number }[] = [];
  let sent = FIRST_SEND;
  for (let round = 1; round <= RETURN_ROUNDS; round++) {
    const got = sent * GROWTH;
    const b = back(got, round);
    rounds.push({ sent, got, back: b, kept: got - b });
    sent = nextSend(sent, b);
  }
  return rounds;
}
