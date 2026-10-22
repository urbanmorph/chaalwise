/**
 * A tab left open across a deploy can ask for a code chunk the server no longer
 * has (each deploy serves only its own files). The page then reloads once, to
 * the new version, instead of leaving a lesson that never starts.
 */

/** How each browser words a dynamic import that failed to load: Chrome, Firefox, Safari. */
const CHUNK_FAILED = /dynamically imported module|Importing a module script failed/;

export const isChunkLoadError = (reason: unknown): boolean =>
  reason instanceof Error && CHUNK_FAILED.test(reason.message);

/** At most one reload a minute, so a chunk that keeps failing cannot loop. */
const SPACING = 60_000;

/**
 * Whether to reload: not again too soon, and, offline, only when the offline
 * worker controls the page and can answer, never to the browser's error page.
 */
export function shouldReload(o: {
  now: number;
  last: number | undefined;
  online: boolean;
  controlled: boolean;
}): boolean {
  if (o.last !== undefined && o.now - o.last < SPACING) return false;
  return o.online || o.controlled;
}
