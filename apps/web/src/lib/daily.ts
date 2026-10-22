import { THEMES } from './puzzles';
import { dayNumber } from './streak';

/**
 * Today's puzzles: the same for everyone on a day, chosen from the date, so they
 * work offline and need nothing from a server. The chess puzzle comes from the
 * puzzles shipped with the site, a different theme each day of the week, at one
 * of the three easier levels. Days are the learner's own calendar days.
 */

/** A well-mixed whole number from a day, so neighbouring days pick far-apart puzzles. */
const mix = (n: number): number => {
  let h = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
};

/** Which shipped puzzle is today's: a theme, a level, and a position in that set (taken modulo its size once loaded). */
export function dailyChess(date: string) {
  const day = dayNumber(date);
  const theme = THEMES[((day % THEMES.length) + THEMES.length) % THEMES.length]!;
  const band = theme.bands[mix(day) % 3]!;
  return { theme, band, index: mix(day + 7919) };
}
