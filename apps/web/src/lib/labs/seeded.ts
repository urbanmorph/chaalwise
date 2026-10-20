/** A random number source in [0, 1), like Math.random, so the labs can be replayed and tested. */
export type Random = () => number;

/** A seeded random (mulberry32): the same seed always gives the same numbers. */
export function seeded(seed: number): Random {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A whole number from min to max, both included. */
export const between = (min: number, max: number, random: Random): number =>
  min + Math.floor(random() * (max - min + 1));
