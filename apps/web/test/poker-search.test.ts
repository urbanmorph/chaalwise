import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { deck, type Card } from '@chaalwise/poker/cards';
import { CATEGORIES, compare, evaluate } from '@chaalwise/poker/evaluate';
import { equity, exactChance, outs, ruleOf } from '@chaalwise/poker/odds';
import { newHand, type Player } from '@chaalwise/poker/table';
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
      '/poker/position/': '/reference/poker/position/',
      // The lesson teaches both; equity is what people search for, and its questions work out equity.
      '/poker/ranges-and-equity/': '/reference/poker/equity/',
      '/poker/expected-value/': '/reference/poker/expected-value/',
      '/poker/implied-odds/': '/reference/poker/implied-odds/',
      '/poker/tilt/': '/reference/poker/tilt/',
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
    expect(title('/reference/poker/equity/')).toBe('Poker equity: what it is and how to work it out · Chaalwise');
    expect(title('/reference/poker/position/')).toBe('Position in poker: why acting last is an advantage · Chaalwise');
    expect(title('/reference/poker/expected-value/')).toBe(
      'Expected value (EV) in poker: how to work it out · Chaalwise',
    );
  });

  it('keeps the plain title for entries without one of their own', () => {
    expect(title('/reference/poker/range/')).toBe('Range · Poker reference · Chaalwise');
  });
});

describe('questions answered on the page and as FAQPage data', () => {
  const PAGES = {
    '/reference/poker/hand-rankings/': ['Does three of a kind beat a straight?', 'Does a flush beat a straight?'],
    '/reference/poker/outs/': ['What is an out in poker?', 'How do you count outs in poker?'],
    '/reference/poker/pot-odds/': ['What are pot odds in poker?', 'How do you work out pot odds?'],
    '/reference/poker/equity/': ['What is equity in poker?', 'How do you work out your equity?'],
    '/reference/poker/position/': ['What is position in poker?', 'Who acts first in poker?'],
    '/reference/poker/expected-value/': ['What is expected value in poker?', 'How do you work out expected value?'],
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
    expect(jsonLd('/reference/poker/range/').some((d) => d['@type'] === 'FAQPage')).toBe(false);
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

describe('answers about equity, position and expected value, as the engine plays them', () => {
  const answer = (page: string, q: string) => shownFaq(page).find((f) => f.q === q)!.a;

  it('works out equity with one card to come, and against a range, as the engine counts it', () => {
    const board = cards('K♥ 7♣ 2♦ 9♠');
    const vsAces = equity(cards('K♦ Q♦'), board, { against: cards('A♥ A♣') });
    const vsKingJack = equity(cards('K♦ Q♦'), board, { against: cards('K♠ J♣') });
    expect(vsAces.exact && vsKingJack.exact).toBe(true);
    expect(vsAces.share).toBeCloseTo((100 * 5) / 44);
    const pct = (x: number) => `${Math.round(x)}%`;
    const work = answer('/reference/poker/equity/', 'How do you work out your equity?');
    expect(work).toContain('K♥ 7♣ 2♦ 9♠');
    expect(work).toContain(`5 of the 44 unseen cards, about ${pct(vsAces.share)}`);
    const range = answer('/reference/poker/equity/', 'How do you find your equity against a range?');
    expect(range).toContain(`aces (${pct(vsAces.share)})`);
    expect(range).toContain(`king and jack (${pct(vsKingJack.share)})`);
    expect(range).toContain(`about ${pct((vsAces.share + vsKingJack.share) / 2)}`);
  });

  it('says who acts first the way the table deals', () => {
    const players: Player[] = [0, 1, 2, 3].map((i) => ({ name: `P${i}`, points: 200, isBot: true }));
    const hand = (n: number) => newHand(players.slice(0, n), 0, deck());
    // Three or four seats: the seat after the big blind (dealer + 3) acts first before the flop.
    expect(hand(4).toAct).toBe(3);
    expect(hand(3).toAct).toBe(0);
    // Two seats: the dealer posts the small blind and acts first.
    expect(hand(2).toAct).toBe(0);
    const a = answer('/reference/poker/position/', 'Who acts first in poker?');
    expect(a).toMatch(/left of the big blind acts first/);
    expect(a).toMatch(/the button acts last/);
  });

  it('works out expected value and its break-even point with the numbers it gives', () => {
    const a = answer('/reference/poker/expected-value/', 'How do you work out expected value?');
    expect(a).toContain('0.25 × 40 − 0.75 × 10 = 2.5');
    expect(0.25 * 40 - 0.75 * 10).toBe(2.5);
    // Calling 10 to win 40 breaks even at 10 / (40 + 10) = 20%, the pot odds.
    const odds = answer('/reference/poker/expected-value/', 'How is expected value related to pot odds?');
    expect(odds).toContain('20%');
    expect(0.2 * 40 - 0.8 * 10).toBe(0);
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
