/**
 * Arrow geometry for the board overlay. Points are in square units on the
 * board as the learner sees it: x to the right, y down, from 0 to 8.
 */
export type Point = [number, number];
type Orientation = 'white' | 'black';

const file = (square: string) => square.charCodeAt(0) - 97;
const rank = (square: string) => Number(square[1]) - 1;

export function squareCenter(square: string, orientation: Orientation): Point {
  const x = file(square) + 0.5;
  const y = 7 - rank(square) + 0.5;
  return orientation === 'white' ? [x, y] : [8 - x, 8 - y];
}

export function isKnightMove(from: string, to: string): boolean {
  const df = Math.abs(file(to) - file(from));
  const dr = Math.abs(rank(to) - rank(from));
  return (df === 1 && dr === 2) || (df === 2 && dr === 1);
}

/** A straight arrow, or for a knight an L: two squares along the long side, then one across. */
export function arrowPoints(from: string, to: string, orientation: Orientation): Point[] {
  const start = squareCenter(from, orientation);
  const end = squareCenter(to, orientation);
  if (!isKnightMove(from, to)) return [start, end];
  const longIsVertical = Math.abs(end[1] - start[1]) > Math.abs(end[0] - start[0]);
  const corner: Point = longIsVertical ? [start[0], end[1]] : [end[0], start[1]];
  return [start, corner, end];
}
