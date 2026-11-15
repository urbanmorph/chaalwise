import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { corpus, frontmatter } from './content';

/**
 * The content of the two checks for transfer: the "Which idea fits?" situations
 * and the cases a week later. Both must make the learner spot the idea, so
 * neither may name it before the answer.
 */
const CONTENT = new URL('../src/content/', import.meta.url);
const strategy = readdirSync(new URL('lessons/strategy/', CONTENT)).map((f) => f.replace('.md', ''));
const titles = Object.fromEntries(
  strategy.map((s) => [s, (frontmatter(`lessons/strategy/${s}.md`) as { title: string }).title]),
);
const skillOf = (lesson: string) => (frontmatter(`lessons/${lesson}.md`) as { skills: string[] }).skills[0] ?? 'none';

type Fits = {
  from?: string;
  prompt: string;
  explanation: string;
  feedback: Record<string, string>;
  alsoFits?: string[];
  pair?: string;
};
const fits = new Map(
  readdirSync(new URL('fits/', CONTENT), { recursive: true })
    .map(String)
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => [f.replace('.yaml', ''), parse(readFileSync(new URL(`fits/${f}`, CONTENT), 'utf8')) as Fits]),
);
const ideaOf = (id: string) => id.split('/')[0]!;

/** Text as lower-case words only, so "Two birds, one stone" matches "two birds one stone". */
const words = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z ]/g, '')
    .replace(/\s+/g, ' ');
/** The words of an idea's name that give it away, such as "blunder check". */
const giveaways = (title: string) => words(title.replace(/^(The |Review calmly: )/, '')).trim();

describe('"Which idea fits?" situations', () => {
  it('are filed under a strategy lesson', () => {
    expect([...fits.keys()].filter((id) => !strategy.includes(ideaOf(id)))).toEqual([]);
  });

  it('give every strategy idea at least two situations', () => {
    const thin = strategy.filter((s) => [...fits.keys()].filter((id) => ideaOf(id) === s).length < 2);
    expect(thin).toEqual([]);
  });

  it('name no idea in the situation, so the learner has to spot it', () => {
    const named = [...fits].flatMap(([id, f]) =>
      Object.values(titles)
        .filter((t) => words(f.prompt).includes(giveaways(t)))
        .map((t) => `${id}: ${t}`),
    );
    expect(named).toEqual([]);
  });

  it('end the situation before its question: the round asks "Which idea fits?"', () => {
    expect([...fits].filter(([, f]) => f.prompt.trim().endsWith('?')).map(([id]) => id)).toEqual([]);
  });

  it('give a reason for each near miss, and name only real ideas other than their own', () => {
    for (const [id, f] of fits) {
      const named = [...Object.keys(f.feedback), ...(f.alsoFits ?? [])];
      for (const idea of named) expect(strategy, `${id}: ${idea}`).toContain(idea);
      expect(named, id).not.toContain(ideaOf(id));
      expect(
        Object.keys(f.feedback).filter((k) => f.alsoFits?.includes(k)),
        id,
      ).toEqual([]);
    }
  });

  it('come from life questions of the same idea, when they were written from one', () => {
    for (const [id, f] of fits)
      if (f.from) {
        expect(corpus.has(f.from), `${id}: ${f.from}`).toBe(true);
        expect(f.from.split('/')[1], id).toBe(ideaOf(id));
      }
  });

  it('include near-miss pairs: two look-alike situations, each calling for the idea the other only seems to', () => {
    const pairs = [...fits].filter(([, f]) => f.pair);
    expect(pairs.length).toBeGreaterThanOrEqual(8);
    for (const [id, f] of pairs) {
      const other = fits.get(f.pair!);
      expect(other, `${id}: ${f.pair}`).toBeDefined();
      expect(other!.pair, id).toBe(id);
      expect(ideaOf(f.pair!), id).not.toBe(ideaOf(id));
      // Each names the other's idea as its near miss, and says why.
      expect(Object.keys(f.feedback), id).toContain(ideaOf(f.pair!));
    }
  });
});

describe('cases a week later', () => {
  const later = readdirSync(new URL('later/', CONTENT)).map((file) => ({
    file,
    data: frontmatter(`later/${file}`) as {
      title: string;
      idea: string;
      steps: ({ ask: string } | { text: string })[];
    },
  }));
  const asks = (c: (typeof later)[number]) => c.data.steps.flatMap((s) => ('ask' in s ? [s.ask] : []));

  it('cover at least eight ideas and six skills', () => {
    const ideas = new Set(later.map((c) => c.data.idea));
    expect(ideas.size).toBe(later.length);
    expect(ideas.size).toBeGreaterThanOrEqual(8);
    const skills = new Set(
      later.map((c) => (c.data.idea.startsWith('labs/') ? labField(c.data.idea, 'track') : skillOf(c.data.idea))),
    );
    expect(skills.size, [...skills].join()).toBeGreaterThanOrEqual(6);
  });

  it('ask two or three decisions each, found in the corpus under the case, and asked nowhere else', () => {
    for (const c of later) {
      const ids = asks(c);
      expect(ids.length, c.file).toBeGreaterThanOrEqual(2);
      expect(ids.length, c.file).toBeLessThanOrEqual(3);
      for (const id of ids) expect(corpus.has(id), id).toBe(true);
      expect(
        ids.every((id) => id.startsWith(`later/${c.file.replace('.md', '')}/`)),
        c.file,
      ).toBe(true);
    }
    const all = later.flatMap(asks);
    expect([...corpus.keys()].filter((id) => id.startsWith('later/')).sort()).toEqual([...all].sort());
  });

  it('do not say which idea they test, in the title, the reading or the decisions', () => {
    for (const c of later) {
      const text = words(JSON.stringify([{ ...c.data, idea: undefined }, ...asks(c).map((id) => corpus.get(id))]));
      expect(text, c.file).not.toContain(giveaways(ideaTitle(c.data.idea)));
      expect(text, c.file).not.toMatch(/\bidea\b|\blesson\b/);
    }
  });

  it('are set in a named place in India, with amounts in rupees written the Indian way: lakh and crore, not 100,000', () => {
    const PLACES =
      /\b(Ahmedabad|Bengaluru|Chennai|Delhi|Hyderabad|Indore|Jaipur|Kochi|Kolkata|Kota|Lucknow|Mumbai|Patna|Pune)\b/;
    for (const c of later) {
      const text = JSON.stringify([c.data, ...asks(c).map((id) => corpus.get(id))]);
      expect(text, c.file).toMatch(PLACES);
      expect(text, c.file).not.toMatch(/₹\d{1,3},\d{3},\d{3}|₹\d{3},\d{3}|Rs\.?\s?\d|INR/);
      for (const [, digits] of text.matchAll(/₹([\d,]+)(?! (?:lakh|crore))/g))
        expect(Number(digits!.replaceAll(',', '')), `${c.file}: ₹${digits}`).toBeLessThan(100_000);
    }
  });
});

/** A lab's title or track, read from the labs list. */
function labField(idea: string, field: 'title' | 'track'): string {
  const source = readFileSync(new URL('../src/lib/labs/labs.ts', import.meta.url), 'utf8');
  const block = source.split(`slug: '${idea.replace('labs/', '')}'`)[1] ?? '';
  return new RegExp(`${field}: ["']([^"']+)["']`).exec(block)?.[1] ?? 'none';
}

/** The name of the lesson or lab a case tests. */
const ideaTitle = (idea: string) =>
  idea.startsWith('labs/') ? labField(idea, 'title') : (frontmatter(`lessons/${idea}.md`) as { title: string }).title;
