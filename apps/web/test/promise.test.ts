import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PROMISE } from '../src/lib/promise';

/**
 * The site's promise, said the same way everywhere it is stated. "No money"
 * is gone from it: learning is free and points are never for sale, which is
 * what the old words meant.
 */
const dist = (file: string) => readFileSync(new URL(`../dist/${file}`, import.meta.url), 'utf8');
const repo = (file: string) => readFileSync(new URL(`../../../${file}`, import.meta.url), 'utf8');
const meta = (html: string) => html.match(/<meta name="description" content="([^"]*)"/)![1]!;

describe('the promise', () => {
  it('reads: free to learn, offline, no account, no ads, and points never for sale', () => {
    expect(PROMISE).toBe('Free to learn, offline, no account, no ads. Points are never for sale.');
  });

  const places = {
    'the home page': dist('index.html'),
    'every page’s footer': dist('chess/index.html').match(/<footer[\s\S]*<\/footer>/)![0],
    'llms.txt': dist('llms.txt'),
    'the terms': repo('TERMS.md'),
    'the README': repo('README.md'),
  };

  it('is stated word for word on the home page, in the footer, in llms.txt, the terms and the README', () => {
    for (const [where, text] of Object.entries(places)) expect(text, where).toContain(PROMISE);
  });

  it('no longer says "no money" where the site states what it is', () => {
    const described = {
      ...places,
      'the default description': meta(dist('index.html')),
      'the app manifest': dist('manifest.webmanifest'),
    };
    for (const [where, text] of Object.entries(described)) expect(text, where).not.toMatch(/no money/i);
  });

  it('keeps the terms’ substance: a learning app, never a money game, points never bought, sold, cashed out or exchanged', () => {
    const terms = repo('TERMS.md');
    expect(terms).toContain('## A learning app, not a game');
    expect(terms).toMatch(/never a money game/i);
    expect(terms).toMatch(/never be bought, sold, transferred, cashed out or exchanged/);
  });
});
