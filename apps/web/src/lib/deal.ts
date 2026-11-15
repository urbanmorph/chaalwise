import { shuffle } from './random';
/**
 * Up to `count` items dealt from the piles in turn, each pile shuffled, the
 * largest first: what is left at the end comes from the front of the order, so
 * two from one pile meet only when one pile is all that is left.
 */
export function deal<T>(piles: readonly (readonly T[])[], count: number, random: () => number = Math.random): T[] {
  const order = shuffle(piles, random)
    .map((pile) => shuffle(pile, random))
    .sort((a, b) => b.length - a.length);
  const out: T[] = [];
  while (out.length < count && order.some((p) => p.length))
    for (const pile of order) if (pile.length && out.length < count) out.push(pile.pop()!);
  return out;
}
