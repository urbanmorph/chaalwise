import { describe, expect, it } from 'vitest';
import { budgetFor, measure } from '../scripts/budget.mjs';

const DIST = new URL('../dist/', import.meta.url).pathname;
const pages = measure(DIST);

describe('JavaScript budgets (plan, section 12: India-first, mid-range phone on slow 4G)', () => {
  it('measures every page', () => {
    expect(pages.map((p) => p.page)).toContain('/chess/board/');
    expect(pages.length).toBeGreaterThanOrEqual(8);
  });

  it('gives board pages 80 KB, the progress dashboard 40 KB and every other page 30 KB, compressed', () => {
    expect(budgetFor('/chess/board/')).toBe(80_000);
    expect(budgetFor('/review/')).toBe(80_000);
    expect(budgetFor('/skills/blunder-check/')).toBe(80_000);
    expect(budgetFor('/skills/')).toBe(30_000);
    expect(budgetFor('/chess/')).toBe(30_000);
    expect(budgetFor('/')).toBe(30_000);
    // The progress dashboard is interactive (period filter, radar), so it sits between the two.
    expect(budgetFor('/progress/')).toBe(40_000);
  });

  it('follows imports, so a lesson page counts the board it loads', () => {
    const lesson = pages.find((p) => p.page === '/chess/board/')!;
    expect(lesson.files.length).toBeGreaterThan(1);
    expect(lesson.files.some((f) => f.includes('LessonPage'))).toBe(true);
  });

  it('loads the scheduler up front where progress is saved, so a deploy mid-lesson cannot break saving', () => {
    for (const page of ['/chess/board/', '/review/']) {
      const files = pages.find((p) => p.page === page)!.files;
      expect(files.some((f) => /\/srs\.[\w-]+\.js$/.test(f))).toBe(true);
    }
    expect(pages.find((p) => p.page === '/chess/')!.files.some((f) => f.includes('/srs.'))).toBe(false);
  });

  it('does not count code loaded only on demand (the import-file validator)', () => {
    const progress = pages.find((p) => p.page === '/progress/')!;
    expect(progress.files.some((f) => f.includes('progress-file'))).toBe(false);
  });

  it.each(pages.map((p) => [p.page, p] as const))('%s is within its budget', (_, p) => {
    expect(p.bytes).toBeLessThanOrEqual(p.budget);
  });
});
