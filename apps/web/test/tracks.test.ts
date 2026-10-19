import { SKILL_IDS } from '@chaalwise/core/skills';
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PROFILE_SKILLS, trackOf } from '../src/lib/profile-skills';

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

  it('says where a track not trained yet will come from, with no practice', () => {
    const html = course('weigh-odds');
    expect(html).toContain('Comes with poker.');
    expect(html).not.toContain('data-practice-count');
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
