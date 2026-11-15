import { licenceIssues, type Source, type Tier } from '@chaalwise/core/sources';
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { THEMES } from '../src/lib/puzzles';
import { corpus, frontmatter } from './content';

/**
 * Where content comes from, and whether its licence lets the site use it. The
 * site will charge for packs, so a non-commercial source may appear nowhere,
 * and paid content may use no share-alike or no-derivatives source either.
 */
const CONTENT = new URL('../src/content/', import.meta.url);
type Meta = { tier?: Tier; sources?: Source[]; steps?: { ask?: string }[]; try?: string[] };
const files = (dir: string, ext: string) =>
  readdirSync(new URL(`${dir}/`, CONTENT), { recursive: true })
    .map(String)
    .filter((f) => f.endsWith(ext))
    .map((f) => ({ id: `${dir}/${f.replace(ext, '')}`, path: `${dir}/${f}` }));

const pieces = [...files('lessons', '.md'), ...files('reference', '.md')].map(({ id, path }) => ({
  id,
  text: readFileSync(new URL(path, CONTENT), 'utf8'),
  data: frontmatter(path) as Meta,
}));
const questions = [...corpus].map(([id, data]) => ({
  id: `questions/${id}`,
  text: JSON.stringify(data),
  data: data as Meta,
}));
const byId = new Map(pieces.map((p) => [p.id, p.data]));

/** A question asked by a paid lesson, or tried on a paid entry, is part of paid content too. */
const paidAsks = new Set(
  pieces
    .filter((p) => p.data.tier === 'paid')
    .flatMap((p) => [...(p.data.steps ?? []).flatMap((s) => (s.ask ? [s.ask] : [])), ...(p.data.try ?? [])]),
);
const tierOf = (id: string, data: Meta): Tier | undefined =>
  id.startsWith('questions/') && paidAsks.has(id.slice('questions/'.length)) ? 'paid' : data.tier;

describe('the sources content is made from', () => {
  it('uses only sources its tier allows: nothing non-commercial anywhere, nothing share-alike or no-derivatives in paid content', () => {
    const issues = [...pieces, ...questions].flatMap(({ id, data }) =>
      licenceIssues(tierOf(id, data), data.sources).map((issue) => `${id}: ${issue}`),
    );
    expect(issues).toEqual([]);
  });

  it('records a source wherever the text cites research by its year', () => {
    const uncited = [...pieces, ...questions]
      .filter(({ text, data }) => /\b(1[89]|20)\d\d\b/.test(text) && !data.sources?.length)
      .map(({ id }) => id);
    expect(uncited).toEqual([]);
  });

  it('credits the Lichess puzzle database, under the licence the shipped puzzles carry, on each entry that offers its puzzles', () => {
    const manifest = JSON.parse(readFileSync(new URL('../src/data/puzzles/manifest.json', import.meta.url), 'utf8'));
    for (const { entry } of THEMES) {
      const lichess = byId.get(`reference/${entry}`)?.sources?.find((s) => /Lichess puzzle database/.test(s.title));
      expect(lichess, entry).toMatchObject({ licence: manifest.licence, url: 'https://database.lichess.org/#puzzles' });
    }
    expect(licenceIssues('paid', [{ title: manifest.source, licence: manifest.licence }])).toEqual([]);
  });

  it('keeps sources out of the questions sent to the browser: they are for the authors', () => {
    const review = readFileSync(new URL('../dist/review/index.html', import.meta.url), 'utf8');
    expect(review).toContain('reference/strategy/framing/operation');
    expect(review).not.toContain('cited-idea');
    expect(
      readFileSync(new URL('../dist/reference/strategy/framing/index.html', import.meta.url), 'utf8'),
    ).not.toContain('cited-idea');
  });
});
