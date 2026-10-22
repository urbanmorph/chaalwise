import { describe, expect, it } from 'vitest';
import { isChunkLoadError, shouldReload } from '../src/lib/stale-chunk';

describe('a tab left open across a deploy, whose code has gone from the server', () => {
  it('recognises a failed chunk load in each browser, and nothing else', () => {
    // Chrome, Firefox and Safari word it differently.
    expect(
      isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: https://x.test/_astro/a.js')),
    ).toBe(true);
    expect(
      isChunkLoadError(new TypeError('error loading dynamically imported module: https://x.test/_astro/a.js')),
    ).toBe(true);
    expect(isChunkLoadError(new TypeError('Importing a module script failed.'))).toBe(true);
    expect(isChunkLoadError(new TypeError('Failed to fetch'))).toBe(false);
    expect(isChunkLoadError(new Error('x is undefined'))).toBe(false);
    expect(isChunkLoadError('Importing a module script failed.')).toBe(false);
    expect(isChunkLoadError(undefined)).toBe(false);
  });

  const at = 1_000_000;
  it('reloads once, to get the new version', () => {
    expect(shouldReload({ now: at, last: undefined, online: true, controlled: false })).toBe(true);
  });

  it('does not reload again within a minute, so a chunk that keeps failing cannot loop', () => {
    expect(shouldReload({ now: at, last: at - 5_000, online: true, controlled: false })).toBe(false);
    expect(shouldReload({ now: at, last: at - 61_000, online: true, controlled: false })).toBe(true);
  });

  it('offline, reloads only when the offline worker can answer, not to the browser’s error page', () => {
    expect(shouldReload({ now: at, last: undefined, online: false, controlled: false })).toBe(false);
    expect(shouldReload({ now: at, last: undefined, online: false, controlled: true })).toBe(true);
  });
});
