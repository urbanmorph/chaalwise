import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { measure } from '../scripts/budget.mjs';
import { LABS } from '../src/lib/labs/labs';

/**
 * Adding a lab adds nothing to the JavaScript of a page that is not the lab's own: the labs list stays at build
 * time, and a page gets the few labs it needs as data in its HTML. Reads the built site: run `pnpm build` first.
 */
const DIST = new URL('../dist/', import.meta.url).pathname;
const pages = measure(DIST);

describe('the labs list stays out of the browser', () => {
  const others = pages.filter((p) => !p.page.startsWith('/labs/'));

  it('checks lesson pages of every kind, review, practice and progress', () => {
    for (const page of [
      '/chess/fork/',
      '/poker/tilt/',
      '/skills/keep-them-guessing/',
      '/skills/think-ahead/',
      '/review/',
      '/progress/',
    ]) {
      expect(others.map((p) => p.page)).toContain(page);
    }
  });

  it.each(others.map((p) => [p.page, p] as const))('%s loads no script that names a lab', (_, { files }) => {
    for (const file of files) {
      const code = readFileSync(DIST + file, 'utf8');
      expect(
        LABS.filter((lab) => code.includes(lab.title)).map((lab) => lab.title),
        file,
      ).toEqual([]);
    }
  });
});
