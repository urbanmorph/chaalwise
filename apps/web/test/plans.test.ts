import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LABS } from '../src/lib/labs/labs';
import { LAB_PLANS } from '../src/lib/labs/plans';
import { frontmatter, lessonsIn } from './content';

type Shown = {
  kind: string;
  text?: string;
  situations?: string[];
  alongside?: string;
  position?: string;
  cards?: object;
  lab?: string;
};
const lessons = lessonsIn('strategy').map(({ file, data }) => ({
  id: file.replace('.md', ''),
  after: data.after!,
  skills: data.skills as string[],
  steps: data.steps as Shown[],
  /** Each step's question id as the lesson asks it, such as `life/review-calmly/launch`; none for reading and plans. */
  asks: (frontmatter(`lessons/strategy/${file}`) as { steps: { ask?: string }[] }).steps.map((s) => s.ask),
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

  it('shows the game, asks what it shares with a case off it, then names the idea, then asks about life', () => {
    for (const { id, steps, asks } of lessons) {
      const ids = stepIds(built(id));
      const compare = steps.findIndex((s) => s.alongside);
      const named = ids.indexOf('off-the-board');
      expect(ids[0], id).toBe('on-the-board');
      expect(compare, id).toBeGreaterThan(0);
      expect(named, id).toBe(compare + 1);
      expect(ids.at(-1), id).toBe('plan');
      expect(steps[named]!.text, id).toMatch(/^What both share has a name: /);
      // The game's questions come before the comparison, the questions about life after the idea.
      expect(ids.length, id).toBe(steps.length);
      asks.forEach((ask, i) => {
        if (!ask || i === compare) return;
        if (ask.startsWith('life/')) expect(i, id).toBeGreaterThan(named);
        else expect(i, id).toBeLessThan(compare);
      });
    }
  });
});

describe('every strategy lesson compares its game with a case off it', () => {
  it('sets a work or study case beside the chess position, the poker cards, or the round of the lab it follows, and asks what the two share', () => {
    for (const { id, after, steps } of lessons) {
      const compares = steps.filter((s) => s.kind === 'choice' && s.alongside);
      expect(compares, id).toHaveLength(1);
      const [compare] = compares;
      if (after.startsWith('labs/')) expect(`labs/${compare!.lab}`, id).toBe(after);
      else if (after.startsWith('poker/')) expect(compare!.cards, id).toBeTruthy();
      else expect(compare!.position, id).toBeTruthy();
    }
  });
});

describe('the poker skills complete the transfer loop', () => {
  // Poker teaches these three skills, and only a strategy lesson carries them away from the table:
  // a hand, a case to compare it with, life questions and a plan (content strategy, priority 1).
  const dist = (path: string) => readFileSync(new URL(`../dist/${path}`, import.meta.url), 'utf8');

  it.each(['weigh-odds', 'read-hidden', 'bluff'])('gives %s a strategy lesson after a poker lesson on it', (skill) => {
    const bridges = lessons.filter((l) => l.skills.includes(skill) && l.after.startsWith('poker/'));
    expect(bridges.length, skill).toBeGreaterThan(0);
    for (const { id, after } of bridges) {
      const poker = frontmatter(`lessons/${after}.md`) as { skills: string[] };
      expect(poker.skills, id).toContain(skill);
      // The poker lesson leads on to it as its next lesson (the rail lists every lesson anyway), and the skill's course lists it.
      const next = dist(`${after}/index.html`).match(
        /&quot;next&quot;:\[0,\{&quot;href&quot;:\[0,&quot;([^&]+)&quot;/,
      )?.[1];
      expect(next, id).toBe(`/skills/${id}/`);
      expect(dist(`skills/${skill}/index.html`), id).toContain(`href="/skills/${id}/"`);
    }
  });
});

describe('the three biases trained in the debiasing experiments', () => {
  // Morewedge et al. (2015) cut the bias blind spot, the fundamental attribution error and projection bias with a game:
  // make the mistake in play, then have it named, with feedback. Each gets a lesson that starts from play.
  const sourcesOf = (id: string) =>
    (frontmatter(`lessons/strategy/${id}.md`) as { sources?: { title: string }[] }).sources?.map((s) => s.title) ?? [];

  it.each([
    ['blame-the-situation-first', 'read-hidden', 'poker/', ['Ross', 'Jones', 'Morewedge']],
    ['they-dont-want-what-you-want', 'read-hidden', 'poker/', ['Ross, David Greene and Pamela House', 'Morewedge']],
    ['your-own-blind-spot', 'composure', 'labs/', ['Pronin', 'Morewedge']],
  ])('teaches %s (%s) after %s, citing its research', (id, skill, from, cited) => {
    const lesson = lessons.find((l) => l.id === id);
    expect(lesson, id).toBeDefined();
    expect(lesson!.skills, id).toEqual([skill]);
    expect(lesson!.after, id).toMatch(new RegExp(`^${from}`));
    for (const name of cited) expect(sourcesOf(id).join(' | '), id).toContain(name);
    // Four to eight steps, with at least three questions about life.
    expect(lesson!.steps.length, id).toBeGreaterThanOrEqual(4);
    expect(lesson!.steps.length, id).toBeLessThanOrEqual(8);
    expect(lesson!.asks.filter((a) => a?.startsWith('life/')).length, id).toBeGreaterThanOrEqual(3);
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
