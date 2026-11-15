import { SKILL_IDS } from '@chaalwise/core/skills';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PLANNED } from '../src/lib/planned-skills';
import { PROFILE_SKILLS, trackOf } from '../src/lib/profile-skills';
import { lessonsIn } from './content';

const dist = (file: string) => readFileSync(new URL(`../dist/${file}`, import.meta.url), 'utf8');
const course = (id: string) => dist(`skills/${id}/index.html`);

describe('each strategy track is a course', () => {
  it('has one course file per track', () => {
    const files = readdirSync(new URL('../src/content/tracks/', import.meta.url)).map((f) => f.replace('.md', ''));
    expect(new Set(files)).toEqual(new Set(SKILL_IDS));
  });

  it('gives every track a page with the idea, why it matters, work and study examples, and the habit', () => {
    for (const id of SKILL_IDS) {
      const html = course(id);
      for (const heading of ['Why it matters', 'At work', 'In study', 'The question to ask'])
        expect(html, `${id}: ${heading}`).toContain(heading);
    }
  });

  it('lists the track lessons in order, with practice and a review of only its questions', () => {
    const html = course('think-ahead');
    expect(html.indexOf('href="/skills/blunder-check/"')).toBeLessThan(html.indexOf('href="/skills/their-next-move/"'));
    expect(html).toContain('data-practice-count');
    expect(html).toContain('href="/review/?track=think-ahead"');
    expect(html).toContain('href="/reference/strategy/blunder-check/"');
  });

  it('draws practice from the strategy lessons and the chess lessons that train it', () => {
    const count = Number(course('think-ahead').match(/data-practice-count="(\d+)"/)![1]);
    expect(count).toBeGreaterThanOrEqual(8);
  });

  it('lists the bluff track’s reference entry, which links both poker lessons on bluffing', () => {
    expect(course('bluff')).toContain('href="/reference/strategy/costly-signals/"');
    const entry = dist('reference/strategy/costly-signals/index.html');
    for (const lesson of ['why-you-bet', 'signals-and-tests'])
      expect(entry, lesson).toContain(`href="/poker/${lesson}/"`);
  });

  it('gives the tracks poker trains practice of their own, off the table as well as at it', () => {
    for (const id of ['weigh-odds', 'size-risk', 'read-hidden', 'bluff'])
      expect(Number(course(id).match(/data-practice-count="(\d+)"/)?.[1]), id).toBeGreaterThanOrEqual(3);
  });

  it('links each track on the strategy page, and in the profile, to its course', () => {
    const index = dist('skills/index.html');
    for (const id of SKILL_IDS) expect(index, id).toContain(`href="/skills/${id}/"`);
    for (const skill of PROFILE_SKILLS) expect(skill.practise.href).toBe(`/skills/${skill.id}/`);
  });
});

describe('which track an answer counts towards', () => {
  it('maps a chess skill to its track, keeps a track as it is, and leaves board sense out', () => {
    expect(trackOf('safety')).toBe('think-ahead');
    expect(trackOf('calculate')).toBe('calculate');
    expect(trackOf('board')).toBeUndefined();
    expect(trackOf(undefined)).toBeUndefined();
  });
});

describe('addresses under /skills/', () => {
  it('never gives a strategy lesson the same address as a track course', () => {
    const lessons = readdirSync(new URL('../src/content/lessons/strategy/', import.meta.url)).map((f) =>
      f.replace('.md', ''),
    );
    expect(lessons.filter((slug) => (SKILL_IDS as string[]).includes(slug))).toEqual([]);
  });
});

describe('lesson names', () => {
  const title = (html: string) => html.match(/<h1[^>]*>([^<]*)<\/h1>/)![1]!.trim();
  const slugs = (folder: string) =>
    readdirSync(new URL(`../src/content/lessons/${folder}/`, import.meta.url)).map((f) => f.replace('.md', ''));
  const lessons = [
    ...slugs('chess').map((s) => ({ href: `/chess/${s}/`, file: `chess/${s}/index.html` })),
    ...slugs('strategy').map((s) => ({ href: `/skills/${s}/`, file: `skills/${s}/index.html` })),
  ].map((l) => ({ ...l, title: title(dist(l.file)) }));
  const entries = ['strategy', 'chess', 'poker', 'labs'].flatMap((game) =>
    readdirSync(new URL(`../dist/reference/${game}/`, import.meta.url)).map((slug) => {
      const html = dist(`reference/${game}/${slug}/index.html`);
      return { id: `${game}/${slug}`, html, term: title(html) };
    }),
  );

  it('keeps the step-by-step lesson apart from the entry on looking at a few options, which has its lesson’s name', () => {
    expect(title(dist('skills/shrink-the-problem/index.html'))).toBe('Small steps that stick');
    expect(dist('reference/strategy/look-at-three/index.html')).toContain('Lesson: <a href="/skills/look-at-three/"');
    expect(existsSync(new URL('../dist/reference/strategy/shrink-the-problem/', import.meta.url))).toBe(false);
  });

  it('shares a name between a lesson and a reference entry only when the entry is that lesson’s idea', () => {
    for (const lesson of lessons)
      for (const entry of entries.filter((e) => e.term === lesson.title))
        expect(entry.html, `${entry.id} and ${lesson.href}`).toContain(`Lesson: <a href="${lesson.href}"`);
  });

  /** Strategy lessons that start from a lab or a poker lesson: off the chess curriculum, listed after it. */
  const after = (game: string) =>
    lessonsIn('strategy')
      .filter(({ data }) => data.after!.startsWith(`${game}/`))
      .map(({ file }) => file.replace('.md', ''));
  const offPath = [...after('labs'), ...after('poker')];

  it('lists every built strategy lesson on the chess path in the curriculum under its own title', () => {
    const planned = PLANNED.map((p) => p.title);
    for (const lesson of lessons.filter(
      (l) => l.href.startsWith('/skills/') && !offPath.includes(l.href.split('/')[2]!),
    ))
      expect(planned).toContain(lesson.title);
  });

  it('labels each strategy lesson on the strategy page by where it starts: a chess stage, or the lab it follows', () => {
    const index = dist('skills/index.html');
    const label = (slug: string) =>
      index.match(new RegExp(`href="/skills/${slug}/"[^]*?<p class="label"[^>]*>([^<]*)</p>`))![1];
    expect(label('blunder-check')).toBe('Chess · stage 1');
    for (const slug of after('labs')) expect(label(slug), slug).toMatch(/^After the .+ lab$/);
  });
});
