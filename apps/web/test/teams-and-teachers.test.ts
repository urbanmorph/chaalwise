import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { STARTS } from '../src/lib/start';

const dist = (file: string) => readFileSync(new URL(`../dist/${file}`, import.meta.url), 'utf8');
const page = (href: string) => new URL(`../dist${href}index.html`, import.meta.url);
const strategyIdeas = readdirSync(new URL('../src/content/lessons/strategy/', import.meta.url)).map((f) =>
  f.replace('.md', ''),
);

describe('where to start, by who you are', () => {
  const html = dist('start/index.html');

  it('offers a short path for people who run teams, people starting out at work, and students', () => {
    expect(STARTS.map((s) => s.id)).toEqual(['run-a-team', 'starting-out', 'students']);
    for (const start of STARTS) {
      expect(start.steps.length, start.id).toBeGreaterThanOrEqual(4);
      expect(start.steps.length, start.id).toBeLessThanOrEqual(6);
      expect(html).toContain(`id="${start.id}"`);
    }
  });

  it('links only to pages that exist, and needs no game met first: strategy lessons and labs only', () => {
    const hrefs = [...html.matchAll(/<ol[\s\S]*?<\/ol>/g)].flatMap((ol) =>
      [...ol[0].matchAll(/href="([^"]+)"/g)].map((m) => m[1]!),
    );
    expect(hrefs.length).toBe(STARTS.reduce((n, s) => n + s.steps.length, 0));
    for (const href of hrefs) {
      expect(href, href).toMatch(/^\/(skills|labs)\//);
      expect(existsSync(page(href)), href).toBe(true);
    }
  });

  it('is reached from the home page, where it says who Chaalwise is for', () => {
    expect(dist('index.html')).toContain('href="/start/"');
  });
});

describe('does this transfer?', () => {
  const html = dist('transfer/index.html');

  it('says what the evidence says, games alone do little, and cites it', () => {
    expect(html).toContain('does little for general thinking');
    expect(html).toMatch(/Sala/);
    expect(html).toMatch(/Gentner/);
    expect(html).toMatch(/href="https:\/\/doi\.org\//);
  });

  it('says what the site cannot promise: it measures answers, not behaviour', () => {
    expect(html).toMatch(/cannot (see|measure)/);
  });

  it('is reached from the home page', () => {
    expect(dist('index.html')).toContain('href="/transfer/"');
  });
});

describe('the printable pack', () => {
  const html = dist('pack/index.html');
  const ideas = [...html.matchAll(/<section class="idea" id="([a-z-]+)"/g)].map((m) => m[1]);

  it('has every strategy idea, each with its questions away from the board and an answer key', () => {
    expect([...ideas].sort()).toEqual([...strategyIdeas].sort());
    for (const id of ideas) {
      const idea = html.match(new RegExp(`<section class="idea" id="${id}"[\\s\\S]*?</section>`))![0];
      expect(idea.match(/<li class="question"/g)?.length ?? 0, id).toBeGreaterThanOrEqual(3);
      expect(idea, id).toContain('class="answers"');
    }
  });

  it('prints one idea to a page, without the site around it', () => {
    expect(html).toMatch(/@media print/);
    expect(html).toMatch(/break-before:\s*page/);
  });

  it('is reached from where to start', () => {
    expect(dist('start/index.html')).toContain('href="/pack/"');
  });
});
