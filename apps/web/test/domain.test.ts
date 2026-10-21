import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LIVE_HOST } from '../src/lib/analytics';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('chaalwise.com', () => {
  it('is the live address, and the site knows it', () => {
    expect(LIVE_HOST).toBe('chaalwise.com');
    expect(read('../astro.config.ts')).toContain("site: 'https://chaalwise.com'");
  });

  it('is served with and without www, and nowhere else', () => {
    const routes = [...read('../wrangler.jsonc').matchAll(/"pattern": "([^"]+)"/g)].map((m) => m[1]);
    expect(routes).toEqual(['chaalwise.com', 'www.chaalwise.com']);
  });

  it('no longer mentions the first address', () => {
    expect(read('../dist/progress/index.html')).not.toContain('chaalwise.urbanmorph');
    expect(read('../dist/progress/index.html')).not.toContain('data-moved');
  });
});
