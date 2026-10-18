import { describe, expect, it } from 'vitest';
import { isHashedAsset, pageKey, typeMatches } from '../src/sw/rules';

describe('service worker rules (SaralCare incident, 10 June 2026)', () => {
  it('treats only content-hashed build files as cacheable forever', () => {
    expect(isHashedAsset('/_astro/Board.CkF7_x-a.js')).toBe(true);
    expect(isHashedAsset('/_astro/newsreader-latin-wght-normal.B2mbPMb4.woff2')).toBe(true);
    expect(isHashedAsset('/_astro/hoisted.js')).toBe(false);
    expect(isHashedAsset('/sw.js')).toBe(false);
    expect(isHashedAsset('/favicon.svg')).toBe(false);
    expect(isHashedAsset('/chess/')).toBe(false);
  });

  it('accepts a response only when its content type fits the file, never HTML for a script', () => {
    expect(typeMatches('/_astro/a.12345678.js', 'text/javascript; charset=utf-8')).toBe(true);
    expect(typeMatches('/_astro/a.12345678.js', 'application/javascript')).toBe(true);
    expect(typeMatches('/_astro/a.12345678.js', 'text/html; charset=utf-8')).toBe(false);
    expect(typeMatches('/_astro/a.12345678.css', 'text/css')).toBe(true);
    expect(typeMatches('/_astro/a.12345678.css', 'text/html')).toBe(false);
    expect(typeMatches('/_astro/a.12345678.woff2', 'font/woff2')).toBe(true);
    expect(typeMatches('/_astro/a.12345678.wasm', 'application/wasm')).toBe(true);
    expect(typeMatches('/_astro/a.12345678.js', null)).toBe(false);
    expect(typeMatches('/_astro/a.12345678.xyz', 'text/plain')).toBe(false);
  });

  it('gives each page one cache key, with or without the trailing slash or query', () => {
    expect(pageKey('https://x.test/chess')).toBe('/chess/');
    expect(pageKey('https://x.test/chess/')).toBe('/chess/');
    expect(pageKey('https://x.test/chess/?from=home#top')).toBe('/chess/');
    expect(pageKey('https://x.test/')).toBe('/');
    expect(pageKey('https://x.test/404.html')).toBe('/404.html');
  });
});
