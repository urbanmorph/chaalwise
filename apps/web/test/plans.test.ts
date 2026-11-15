import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LABS } from '../src/lib/labs/labs';
import { LAB_PLANS } from '../src/lib/labs/plans';
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

/** A plan's situations complete "When …" and its action completes the sentence, as the plan step shows them. */
const wellFormed = (where: string, { situations, action }: { situations?: string[]; action?: string }) => {
  expect(situations!.length, where).toBeGreaterThanOrEqual(3);
  for (const s of situations!) expect(s, where).toMatch(/^(I |[a-z])/);
  expect(action, where).toMatch(/^I will /);
};

describe('every poker lesson ends with a plan to use its skill away from the table', () => {
  it('asks the learner when they will use it, with situations from life, not from poker', () => {
    for (const { file, data } of lessonsIn('poker')) {
      const last = data.steps.at(-1) as { kind: string; prompt?: string; situations?: string[]; action?: string };
      expect(last.kind, file).toBe('plan');
      expect(last.prompt, file).toMatch(/away from the (card )?table/);
      wellFormed(file, last);
      for (const s of last.situations!) expect(s, file).not.toMatch(/\b(poker|pot|fold|bet|chips?|cards?)\b/i);
    }
  });
});

describe('every lab offers a plan after its debrief', () => {
  it('names the moment and the action in plain words, away from the game', () => {
    for (const lab of LABS) {
      const plan = LAB_PLANS[lab.slug]!;
      expect(plan.prompt, lab.slug).toMatch(/^When will you .+\?$/);
      wellFormed(lab.slug, plan);
    }
  });
});
