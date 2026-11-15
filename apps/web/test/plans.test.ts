import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { lessonsIn } from './content';

const lessons = lessonsIn('strategy').map(({ file, data }) => ({
  id: file.replace('.md', ''),
  steps: data.steps as { kind: string; text?: string; situations?: string[]; alongside?: string; position?: string }[],
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

describe('every strategy lesson names its idea after the comparison, not before', () => {
  // Comparing two cases transfers best when learners first find what they share,
  // and the idea is named afterwards (Alfieri et al. 2013; Gentner et al. 2003).
  const built = (id: string) => readFileSync(new URL(`../dist/skills/${id}/index.html`, import.meta.url), 'utf8');
  const stepIds = (html: string) =>
    [...html.matchAll(/&quot;id&quot;:\[0,&quot;([a-z0-9/-]+)&quot;/g)].map((m) => m[1]!);

  it('shows the board, asks what it shares with a case off it, then names the idea, then asks about life', () => {
    for (const { id, steps } of lessons) {
      const ids = stepIds(built(id));
      const compare = ids.indexOf(`strategy/${id}/compare`);
      const named = ids.indexOf('off-the-board');
      expect(ids[0], id).toBe('on-the-board');
      expect(compare, id).toBeGreaterThan(0);
      expect(named, id).toBe(compare + 1);
      expect(ids.at(-1), id).toBe('plan');
      expect(steps[named]!.text, id).toMatch(/^What both share has a name: /);
      // The board questions come before the comparison, the questions away from the board after the idea.
      expect(ids.length, id).toBe(steps.length);
      steps.forEach((s, i) => {
        if (s.kind === 'read' || s.kind === 'plan' || i === compare) return;
        if (s.position) expect(i, id).toBeLessThan(compare);
        else expect(i, id).toBeGreaterThan(named);
      });
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
