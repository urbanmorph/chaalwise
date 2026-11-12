import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Card } from '@chaalwise/poker/cards';
import { CATEGORIES, compare, evaluate } from '@chaalwise/poker/evaluate';
import { exactChance, outs, ruleOf } from '@chaalwise/poker/odds';
import { CANONICAL_ELSEWHERE } from '../src/lib/canonical';

/**
 * Each poker topic has one page for search: the reference entry. The lesson on
 * the same idea stays in the course and names the entry as its canonical
 * address. These tests read the built site; run `pnpm build` first.
 */
const SITE = 'https://chaalwise.com';
const html = (page: string) => readFileSync(new URL(`../dist${page}index.html`, import.meta.url), 'utf8');
const title = (page: string) => html(page).match(/<title>([^<]*)<\/title>/)![1];
const canonical = (page: string) => html(page).match(/<link rel="canonical" href="([^"]+)"/)?.[1];
const text = (s: string) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
const jsonLd = (page: string) =>
  [...html(page).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]!));

/** The questions a page shows, and the answers under them, as plain text. */
function shownFaq(page: string) {
  const section = html(page).match(/<section class="faq[^"]*"[\s\S]*?<\/section>/)?.[0] ?? '';
  return [...section.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/g)].map((m) => ({
    q: text(m[1]!),
    a: text(m[2]!),
  }));
}

/** Rows of the first table on a page, each as its cells' text. */
const tableRows = (page: string) =>
  [...html(page).matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((row) =>
    [...row[1]!.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) => text(c[1]!)),
  );

/** Cards as written on the page, such as "10♥ 9♠", in the engine's notation. */
const SUITS: Record<string, string> = { '♠': 's', '♥': 'h', '♦': 'd', '♣': 'c' };
const cards = (written: string) =>
  written.split(' ').map((c) => `${c.slice(0, -1).replace('10', 'T')}${SUITS[c.slice(-1)]}`) as Card[];

describe('one page for each poker topic', () => {
  it('keeps the lessons in the course, pointing search at the reference entry on the same idea', () => {
    expect(CANONICAL_ELSEWHERE).toEqual({
      '/poker/hand-rankings/': '/reference/poker/hand-rankings/',
      '/poker/outs-and-odds/': '/reference/poker/outs/',
    });
    for (const [lesson, entry] of Object.entries(CANONICAL_ELSEWHERE)) {
      expect(canonical(lesson), lesson).toBe(`${SITE}${entry}`);
      expect(canonical(entry), entry).toBe(`${SITE}${entry}`);
      // The lesson still links to the entry, and the entry back to the lesson.
      expect(html(lesson), lesson).toContain(`href="${entry}"`);
      expect(html(entry), entry).toContain(`href="${lesson}"`);
    }
  });

  it('leaves the lessons out of the sitemap, and lists the entries', () => {
    const sitemap = readFileSync(new URL('../dist/sitemap.xml', import.meta.url), 'utf8');
    for (const [lesson, entry] of Object.entries(CANONICAL_ELSEWHERE)) {
      expect(sitemap).not.toContain(`<loc>${SITE}${lesson}</loc>`);
      expect(sitemap).toContain(`<loc>${SITE}${entry}</loc>`);
    }
  });
});

describe('titles in the words people search', () => {
  it('names each entry the way the question is asked', () => {
    expect(title('/reference/poker/hand-rankings/')).toBe(
      'Poker hand rankings: what beats what (with chart) · Chaalwise',
    );
    expect(title('/reference/poker/outs/')).toBe('Outs in poker: what they are and how to count them · Chaalwise');
    expect(title('/reference/poker/pot-odds/')).toBe(
      'Pot odds in poker: how to work them out, and when to call · Chaalwise',
    );
  });

  it('keeps the plain title for entries without one of their own', () => {
    expect(title('/reference/poker/position/')).toBe('Position · Poker reference · Chaalwise');
  });
});

describe('questions answered on the page and as FAQPage data', () => {
  const PAGES = {
    '/reference/poker/hand-rankings/': ['Does three of a kind beat a straight?', 'Does a flush beat a straight?'],
    '/reference/poker/outs/': ['What is an out in poker?', 'How do you count outs in poker?'],
    '/reference/poker/pot-odds/': ['What are pot odds in poker?', 'How do you work out pot odds?'],
  };

  it('shows every question and answer that the structured data gives, word for word', () => {
    for (const [page, asked] of Object.entries(PAGES)) {
      const faqs = jsonLd(page).filter((d) => d['@type'] === 'FAQPage');
      expect(faqs, page).toHaveLength(1);
      const data = faqs[0].mainEntity.map((q: { '@type': string; name: string; acceptedAnswer: { text: string } }) => {
        expect(q['@type']).toBe('Question');
        return { q: q.name, a: q.acceptedAnswer.text };
      });
      expect(shownFaq(page), page).toEqual(data);
      expect(
        data.map((d: { q: string }) => d.q),
        page,
      ).toEqual(expect.arrayContaining(asked));
    }
  });

  it('gives FAQPage data only where a page shows questions', () => {
    expect(jsonLd('/reference/poker/position/').some((d) => d['@type'] === 'FAQPage')).toBe(false);
  });

  it('answers what beats what as the cards do', () => {
    const answer = (q: string) => shownFaq('/reference/poker/hand-rankings/').find((f) => f.q === q)!.a;
    const beats = (a: string, b: string) => compare(evaluate(cards(a)), evaluate(cards(b)));
    expect(answer('Does three of a kind beat a straight?')).toMatch(/^No\. A straight beats three of a kind/);
    expect(beats('5♣ 4♦ 3♠ 2♥ A♣', 'A♠ A♥ A♦ K♣ Q♠')).toBeGreaterThan(0);
    expect(answer('Does a flush beat a straight?')).toMatch(/^Yes\. A flush beats a straight/);
    expect(beats('7♦ 5♦ 4♦ 3♦ 2♦', 'A♠ K♥ Q♦ J♣ 10♠')).toBeGreaterThan(0);
    expect(answer('Does a full house beat a flush?')).toMatch(/^Yes\./);
    expect(beats('3♠ 3♥ 3♦ 2♣ 2♠', 'A♦ K♦ Q♦ J♦ 9♦')).toBeGreaterThan(0);
  });
});

describe('the hand rankings chart', () => {
  it('lists the nine hands from best to worst, each with an example that is that hand', () => {
    const rows = tableRows('/reference/poker/hand-rankings/');
    expect(rows[0]).toEqual(['', 'Hand', 'What it is', 'Example']);
    const hands = rows.slice(1);
    expect(hands.map((r) => r[0])).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9']);
    const best = [...CATEGORIES].reverse();
    hands.forEach(([, name, , example], i) => {
      expect(evaluate(cards(example!)).category, name).toBe(best[i]);
      expect(name!.toLowerCase().replace(/ /g, '-').replace('one-pair', 'pair'), example).toBe(best[i]);
    });
  });
});

describe('the outs table', () => {
  it('gives each draw the outs the engine counts, and the chances worked out exactly', () => {
    const rows = tableRows('/reference/poker/outs/');
    expect(rows[0]).toEqual(['Draw', 'Your cards', 'Shared cards', 'Outs', 'Flop to river', 'Turn to river']);
    expect(rows.length).toBeGreaterThanOrEqual(5);
    for (const [draw, hole, board, n, flop, turn] of rows.slice(1)) {
      const count = outs(cards(hole!), cards(board!)).count;
      expect(Number(n), draw).toBe(count);
      const pct = (x: number) => `${Math.round(x)}%`;
      expect(flop, draw).toBe(`${pct(exactChance(count, 47, 2))} (rule: ${ruleOf(count, 2)}%)`);
      expect(turn, draw).toBe(`${pct(exactChance(count, 46, 1))} (rule: ${ruleOf(count, 1)}%)`);
    }
  });
});
