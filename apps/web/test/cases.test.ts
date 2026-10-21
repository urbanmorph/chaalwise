import { SKILL_IDS, SKILLS } from '@chaalwise/core/skills';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { corpus, lessonsIn } from './content';

/**
 * Work cases: short stories of linked decisions that use the strategy ideas
 * already taught. These tests read the built site, so run `pnpm build` first.
 */
const DIST = new URL('../dist/', import.meta.url);
const dist = (path: string) => readFileSync(new URL(path, DIST), 'utf8');
const cases = lessonsIn('cases').map(({ file, data }) => ({ slug: file.replace('.md', ''), data }));
const caseIds = (slug: string) =>
  [...corpus.keys()].filter((id) => id.startsWith(`cases/${slug}/`)).map((id) => id.split('/').pop()!);

/** Every idea a case can call on: the strategy tracks, the strategy lessons' titles and the strategy reference terms. */
const CONTENT = new URL('../src/content/', import.meta.url);
const ideaIn = (folder: string) =>
  readdirSync(new URL(folder, CONTENT)).map((f) => {
    const data = parse(readFileSync(new URL(`${folder}${f}`, CONTENT), 'utf8').split(/^---$/m)[1]!) as {
      title?: string;
      term?: string;
    };
    return data.title ?? data.term!;
  });
const IDEAS = [...Object.values(SKILLS), ...ideaIn('lessons/strategy/'), ...ideaIn('reference/strategy/')].map((idea) =>
  idea.replace(/:.*$/, '').toLowerCase(),
);

describe('the work cases', () => {
  it('number about six, for students, people starting out at work, and people who run a team', () => {
    expect(cases.length).toBeGreaterThanOrEqual(6);
    const groups = new Set(cases.map((c) => c.data.stage));
    for (const group of [1, 2, 3]) expect(groups.has(group), `group ${group}`).toBe(true);
  });

  it('each tell a story of three to five decisions, with reading between them and a plan at the end', () => {
    for (const { slug, data } of cases) {
      const kinds = data.steps.map((s) => s.kind);
      const decisions = kinds.filter((k) => k === 'choice').length;
      expect(decisions, slug).toBeGreaterThanOrEqual(3);
      expect(decisions, slug).toBeLessThanOrEqual(5);
      expect(kinds[0], `${slug} opens with the story`).toBe('read');
      expect(kinds.at(-1), `${slug} ends with a plan`).toBe('plan');
      kinds.forEach((kind, i) => {
        if (kind === 'choice' && kinds[i + 1] === 'choice')
          throw new Error(`${slug}: two decisions with no story between`);
      });
    }
  });

  it('keep their own questions in the corpus, one folder each, and ask all of them', () => {
    for (const { slug, data } of cases) {
      const asked = data.steps.filter((s) => s.kind === 'choice').map((s) => s.id);
      expect(asked.sort(), slug).toEqual(caseIds(slug).sort());
    }
  });

  it('measure the tracks they name, and name every track they measure', () => {
    for (const { slug, data } of cases) {
      const measured = new Set(data.steps.flatMap((s) => (s.kind === 'choice' && s.measures ? [s.measures] : [])));
      expect(measured, slug).toEqual(new Set(data.skills));
    }
  });

  it('between them use every strategy track', () => {
    const used = new Set(cases.flatMap((c) => c.data.skills));
    expect([...SKILL_IDS].filter((id) => !used.has(id))).toEqual([]);
  });

  it('name the idea each decision uses, as it is called in a lesson or the reference', () => {
    for (const { slug, data } of cases)
      for (const step of data.steps)
        if (step.kind === 'choice')
          expect(
            IDEAS.some((idea) => step.explanation.toLowerCase().includes(idea)),
            `${slug}/${step.id}: ${step.explanation}`,
          ).toBe(true);
  });
});

describe('a work case page', () => {
  it('is built for each case, under /cases/, off every game path', () => {
    for (const { slug, data } of cases) {
      const html = dist(`cases/${slug}/index.html`);
      expect(html.match(/<h1[^>]*>([^<]*)<\/h1>/)?.[1]?.replaceAll('&#39;', "'"), slug).toBe(data.title);
      expect(html, slug).not.toContain('data-testid="meet-chess"');
      expect(html, slug).toContain('href="/cases/"');
    }
    expect(dist('chess/index.html')).not.toContain('href="/cases/');
  });

  it('logs each answer to the track it measures', () => {
    for (const { slug, data } of cases) {
      const html = dist(`cases/${slug}/index.html`);
      const measured = new Set([...html.matchAll(/measures&quot;:\[0,&quot;([a-z-]+)/g)].map((m) => m[1]!));
      expect(measured, slug).toEqual(new Set(data.skills));
    }
  });

  it('links to the lessons and reference entries of the ideas it uses, and each link works', () => {
    for (const { slug } of cases) {
      const html = dist(`cases/${slug}/index.html`);
      const intro = html.match(/<div class="intro"[^>]*>([\s\S]*?)<\/div>/)![1]!;
      const links = [...intro.matchAll(/href="(\/[^"]+)"/g)].map((m) => m[1]!);
      expect(links.length, slug).toBeGreaterThanOrEqual(2);
      for (const href of links) expect(existsSync(new URL(`.${href}index.html`, DIST)), `${slug}: ${href}`).toBe(true);
    }
  });
});

describe('reaching the work cases', () => {
  it('lists every case on the index, with the tracks it trains', () => {
    const index = dist('cases/index.html');
    for (const { slug, data } of cases) {
      expect(index, slug).toContain(`href="/cases/${slug}/"`);
      for (const track of data.skills) expect(index, `${slug}: ${track}`).toContain(`href="/skills/${track}/"`);
    }
  });

  it('links each case from the course of every track it trains', () => {
    for (const { slug, data } of cases)
      for (const track of data.skills)
        expect(dist(`skills/${track}/index.html`), `${track}: ${slug}`).toContain(`href="/cases/${slug}/"`);
  });

  it('links the index from the strategy page', () => {
    expect(dist('skills/index.html')).toContain('href="/cases/"');
  });
});
