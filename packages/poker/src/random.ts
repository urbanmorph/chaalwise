/** A source of numbers in [0, 1), like Math.random. */
export type Random = () => number;

/**
 * A small seeded random source (mulberry32), so tests and lessons can repeat a hand.
 * The same as `seeded` in @chaalwise/teach, kept here so poker needs no chess code.
 */
export function seeded(seed: number): Random {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
