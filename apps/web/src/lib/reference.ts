import type { ReferenceEntry } from '@chaalwise/core/reference';
import { moveIssue, setup, type Issue } from './chess';

/** Problems with a reference entry's board, so a wrong diagram fails the build. Its questions are checked in the corpus. */
export function referenceIssues(entry: ReferenceEntry): Issue[] {
  if (entry.position === undefined) return [];
  let pos;
  try {
    pos = setup(entry.position);
  } catch (error) {
    return [{ path: ['position'], message: (error as Error).message }];
  }
  if (!pos) return [{ path: ['position'], message: `not a legal position: ${entry.position}` }];
  const message = entry.move && moveIssue(pos, entry.move);
  return message ? [{ path: ['move'], message }] : [];
}

/** Moves numbered the way books write them: `e4 e5 Nf3` becomes `1.e4 e5 2.Nf3`. */
export const numberedMoves = (moves: string) =>
  moves
    .trim()
    .split(/\s+/)
    .map((san, i) => (i % 2 ? san : `${i / 2 + 1}.${san}`))
    .join(' ');

/** An entry's page, from its id such as `chess/fork`. */
export const entryHref = (id: string) => `/reference/${id}/`;
