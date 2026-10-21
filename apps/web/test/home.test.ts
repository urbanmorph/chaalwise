import { SKILL_IDS } from '@chaalwise/core/skills';
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { HERO, pieceImages } from '../src/lib/diagram';
import { PROFILE_SKILLS } from '../src/lib/profile-skills';
import { bestIn, TRACKS } from '../src/lib/skill-tracks';
import { fromFen, legal, play } from '@chaalwise/teach/position';

const dist = (file: string) => readFileSync(new URL(`../dist/${file}`, import.meta.url), 'utf8');

describe('the skill map', () => {
  it('covers every skill track once, each with its everyday payoff', () => {
    expect(TRACKS.map((t) => t.id).sort()).toEqual([...SKILL_IDS].sort());
    for (const t of TRACKS) expect(t.inLife.length).toBeGreaterThan(20);
  });

  it('lists the skills chess trains now first', () => {
    const now = TRACKS.map((t) => t.chess > 0);
    expect(now.indexOf(false)).toBeGreaterThan(0);
    expect(now.slice(now.indexOf(false))).not.toContain(true);
  });

  it('offers only skills with practice behind them: every one is measured now', () => {
    expect(PROFILE_SKILLS.filter((s) => s.later)).toEqual([]);
  });

  it('files each skill under the game that trains it best', () => {
    const where = (game: string) => TRACKS.filter((t) => bestIn(t) === game).map((t) => t.id);
    expect(where('chess')).toEqual(['think-ahead', 'calculate', 'plan-long']);
    expect(where('poker')).toEqual(['size-risk', 'composure', 'weigh-odds', 'read-hidden', 'bluff']);
    expect(where('labs')).toEqual(['cooperate', 'unpredictable', 'value']);
  });
});

describe('the hero diagram', () => {
  it('is a legal position where the arrowed move is legal and gives check, forking king and rook', () => {
    const pos = fromFen(HERO.fen);
    expect(legal(pos, HERO.move)).toBeDefined();
    expect(play(pos, HERO.move).isCheck()).toBe(true);
  });

  it('draws pieces from the board’s own piece set', () => {
    const images = pieceImages();
    expect(images['white-knight']).toMatch(/^data:image\/svg\+xml;base64,/);
    expect(Object.keys(images)).toHaveLength(12);
  });
});

describe('the built home page', () => {
  const html = dist('index.html');

  it('sells skills first: one map row per skill, each linking to its course', () => {
    const rows = [...html.matchAll(/data-track="([a-z-]+)"/g)].map((m) => m[1]);
    expect(rows.sort()).toEqual([...SKILL_IDS].sort());
    for (const id of SKILL_IDS) expect(html, id).toContain(`href="/skills/${id}/"`);
  });

  it('draws the chess diagram with no script', () => {
    const figure = html.match(/<figure class="idea-board[\s\S]*?<\/figure>/)![0];
    expect(figure).not.toContain('<script');
    expect(figure.match(/<use /g)).toHaveLength(HERO.pieces);
    // Each piece image once, however many times it is used: here a king, rook and pawns of each side, and a knight.
    expect(figure.match(/<image /g)).toHaveLength(6);
  });
});

describe('the mark', () => {
  const png = (file: string) => {
    const b = readFileSync(new URL(`../dist/${file}`, import.meta.url));
    return { isPng: b.subarray(1, 4).toString() === 'PNG', width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  };

  it("is the knight's L: a move that turns a corner, the same in the favicon and the header", () => {
    expect(dist('favicon.svg')).toContain('id="chaal"');
    expect(dist('index.html')).toMatch(/<a class="brand"[^>]*>\s*<svg[^>]*class="mark"/);
  });

  it('ships the PNG icons phones need, listed in the manifest', () => {
    const manifest = JSON.parse(dist('manifest.webmanifest')) as { icons: { src: string; sizes: string }[] };
    for (const size of [192, 512]) {
      const icon = manifest.icons.find((i) => i.sizes === `${size}x${size}`)!;
      expect(png(icon.src.slice(1))).toEqual({ isPng: true, width: size, height: size });
    }
    expect(png('apple-touch-icon.png')).toEqual({ isPng: true, width: 180, height: 180 });
    expect(dist('index.html')).toContain('<link rel="apple-touch-icon" href="/apple-touch-icon.png"');
  });
});

describe('strategy first', () => {
  const html = dist('index.html');
  const nav = (page: string) =>
    [
      ...dist(page)
        .match(/<nav aria-label="Main"[\s\S]*?<\/nav>/)![0]
        .matchAll(/>([a-z]+)<\/a>/g),
    ].map((m) => m[1]);

  it('leads every page with strategy: the games are found through the reference', () => {
    for (const page of ['index.html', 'chess/index.html', 'reference/index.html'])
      expect(nav(page)).toEqual(['strategy', 'reference', 'review', 'progress']);
  });

  it('starts a newcomer on a strategy lesson, not a chess one', () => {
    const primary = html.match(/<a class="button primary" href="([^"]+)"/)![1];
    expect(primary).toMatch(/^\/skills\/[a-z-]+\/$/);
  });

  it('shows one idea in three settings on the first screen: chess, poker and work, with who it is for', () => {
    const hero = html.match(/<section class="hero[\s\S]*?<\/section>/)![0];
    expect(hero).toContain('<figure class="idea-board');
    for (const setting of ['In chess', 'In poker', 'At work']) expect(hero).toContain(setting);
    expect(hero).toMatch(/run teams/);
    expect(hero).toMatch(/students/);
  });

  it('groups the skills by the game that trains them, each group with its game named', () => {
    const groups = [...html.matchAll(/<section class="game" data-game="([a-z]+)"/g)].map((m) => m[1]);
    expect(groups).toEqual(['chess', 'poker', 'labs']);
  });

  it('is short: the page reads in a minute, not five', () => {
    const main = html.match(/<main[\s\S]*?<\/main>/)![0];
    const words = main
      .replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>|<svg[\s\S]*?<\/svg>/g, '')
      .replace(/<[^>]+>/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
    expect(words.length).toBeLessThan(420);
  });

  it('has one way to start, named for the school, not a game', () => {
    const starts = [...html.matchAll(/<a class="button primary"[^>]*>([^<]*)</g)].map((m) => m[1]!.trim());
    expect(starts).toEqual(['Start the first lesson']);
  });

  it('speaks to people who run things and to students, and keeps games off the front page', () => {
    expect(html).toMatch(/run (teams|things|organisations)/);
    expect(html).toMatch(/students/i);
    expect(html).not.toContain('Pick a game');
  });
});

describe('claims the evidence supports', () => {
  const html = dist('index.html');

  it('says carrying a skill over is more likely with practice off the board, not that naming it is enough', () => {
    expect(html).toContain('does little for general thinking');
    expect(html).toMatch(/more likely to carry over/);
    expect(html).not.toMatch(/Skills carry over when/);
  });

  it('promises new positions only for chess ideas, which are the ones made afresh', () => {
    expect(html).not.toContain('Each idea returns in new positions');
  });
});

describe('the footer', () => {
  const footer = dist('index.html').match(/<footer class="site-footer"[\s\S]*?<\/footer>/)![0];
  const REPO = 'https://github.com/urbanmorph/chaalwise/blob/main';

  it('links to the terms, which say it is a learning app and how to raise an issue', () => {
    expect(footer).toMatch(new RegExp(`href="${REPO}/TERMS.md"[^>]*>\\s*terms`));
  });

  it('links the credits to CREDITS.md in the repository, with no credits page on the site', () => {
    expect(footer).toMatch(new RegExp(`href="${REPO}/CREDITS.md"[^>]*>\\s*credits`));
    expect(existsSync(new URL('../dist/credits/index.html', import.meta.url))).toBe(false);
  });

  it('links pdgi to the scorecard in the repository, not the pdgi.org site', () => {
    expect(footer).toMatch(new RegExp(`href="${REPO}/PDGI.md"[^>]*>\\s*pdgi`));
    expect(footer).not.toContain('href="https://pdgi.org/"');
  });
});

describe('analytics', () => {
  it('loads the Cloudflare beacon, with its token, only on the live site', async () => {
    const { BEACON_TOKEN, LIVE_HOST } = await import('../src/lib/analytics');
    const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
    expect(html).toMatch(new RegExp(`location\\.host===?[\`"']${LIVE_HOST.replaceAll('.', '\\.')}`));
    expect(html).toContain(BEACON_TOKEN);
  });
});
