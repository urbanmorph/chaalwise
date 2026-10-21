import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const dist = (file: string) => readFileSync(new URL(`../dist/${file}`, import.meta.url));
const meta = (html: string, key: string) =>
  html.match(new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`))?.[1];

describe('the share card', () => {
  it('is a 1200 by 630 PNG, the size link previews expect', () => {
    const png = dist('og.png');
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
  });

  it.each([
    ['index.html', 'https://chaalwise.com/'],
    ['cases/index.html', 'https://chaalwise.com/cases/'],
    ['skills/blunder-check/index.html', 'https://chaalwise.com/skills/blunder-check/'],
  ])('is on %s, with its own title, description and address', (file, url) => {
    const html = dist(file).toString();
    expect(meta(html, 'og:image')).toBe('https://chaalwise.com/og.png');
    expect(meta(html, 'og:url')).toBe(url);
    expect(meta(html, 'og:title')).toBe(html.match(/<title>([^<]*)<\/title>/)![1]);
    expect(meta(html, 'og:description')).toBe(meta(html, 'description'));
    expect(meta(html, 'twitter:card')).toBe('summary_large_image');
  });
});
