import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const dir = new URL('../src/content/lessons/strategy/', import.meta.url);
const lessons = readdirSync(dir).map((f) => ({
  id: f.replace('.md', ''),
  steps: (
    parse(readFileSync(new URL(f, dir), 'utf8').split(/^---$/m)[1]!) as {
      steps: { kind: string; situations?: string[]; alongside?: string; position?: string }[];
    }
  ).steps,
}));

describe('every strategy lesson ends with a plan to use the idea', () => {
  it('asks the learner when they will use it, with situations from work, study and home', () => {
    for (const { id, steps } of lessons) {
      const last = steps.at(-1)!;
      expect(last.kind, id).toBe('plan');
      expect(last.situations!.length, id).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('every strategy lesson compares its board with a case off it', () => {
  it('sets a work or study case beside the chess position, and asks what the two share', () => {
    for (const { id, steps } of lessons)
      expect(
        steps.some((s) => s.kind === 'choice' && s.alongside && s.position),
        id,
      ).toBe(true);
  });
});
