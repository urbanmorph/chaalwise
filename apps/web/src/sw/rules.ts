/**
 * The caching rules, kept pure so they can be tested. Learned from SaralCare's
 * incident (10 June 2026), where a worker served stale or HTML responses for
 * hashed script chunks and broke the app after a deploy.
 */

/** Astro writes build files as `/_astro/<name>.<8-character hash>.<ext>`. */
export const isHashedAsset = (path: string) => /^\/_astro\/[^/]+\.[\w-]{8}\.[a-z0-9]+$/.test(path);

const TYPES: Record<string, RegExp> = {
  js: /^(text|application)\/javascript\b/,
  css: /^text\/css\b/,
  woff2: /^font\/woff2\b/,
  svg: /^image\/svg\+xml\b/,
  png: /^image\/png\b/,
  webp: /^image\/webp\b/,
  json: /^application\/json\b/,
  wasm: /^application\/wasm\b/,
};

/** A response may stand in for a file only if its content type fits the extension. */
export function typeMatches(path: string, contentType: string | null): boolean {
  const pattern = TYPES[path.slice(path.lastIndexOf('.') + 1)];
  return !!pattern && !!contentType && pattern.test(contentType);
}

/** One key per page: `/chess` and `/chess/?x` are both `/chess/`. */
export function pageKey(url: string): string {
  const { pathname } = new URL(url);
  return pathname.endsWith('/') || /\.[a-z0-9]+$/i.test(pathname) ? pathname : `${pathname}/`;
}
