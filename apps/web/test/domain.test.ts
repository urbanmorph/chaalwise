import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LIVE_HOST, OLD_HOST } from '../src/lib/analytics';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('chaalwise.com', () => {
  it('is the live address, and the site knows it', () => {
    expect(LIVE_HOST).toBe('chaalwise.com');
    expect(read('../astro.config.ts')).toContain("site: 'https://chaalwise.com'");
  });

  it('is served with www, and the old address is kept so it can redirect', () => {
    const routes = [...read('../wrangler.jsonc').matchAll(/"pattern": "([^"]+)"/g)].map((m) => m[1]);
    expect(routes).toEqual(['chaalwise.com', 'www.chaalwise.com', OLD_HOST]);
  });

  it('tells learners on the old address to take their progress with them, and no one else', () => {
    const html = read('../dist/progress/index.html');
    const note = html.match(/<div[^>]*data-moved[\s\S]*?<\/div>/)![0];
    expect(note).toContain('hidden');
    expect(note).toContain('href="https://chaalwise.com/progress/"');
    expect(html).toMatch(new RegExp(`location\\.host===?["'\`]${OLD_HOST.replaceAll('.', '\\.')}`));
  });
});
