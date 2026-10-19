import { SKILL_IDS } from '@chaalwise/core/skills';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { HERO, pieceImages } from '../src/lib/diagram';
import { TRACKS } from '../src/lib/skill-tracks';
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

  it('sells skills first: one map row per skill, linking to where it is trained', () => {
    const rows = [...html.matchAll(/data-track="([a-z-]+)"/g)].map((m) => m[1]);
    expect(rows.sort()).toEqual([...SKILL_IDS].sort());
    const skills = dist('skills/index.html');
    for (const [, id] of html.matchAll(/href="\/skills\/#([a-z-]+)"/g)) expect(skills).toContain(`id="${id}"`);
  });

  it('draws the chess diagram with no script', () => {
    const figure = html.match(/<figure class="hero-board[\s\S]*?<\/figure>/)![0];
    expect(figure).not.toContain('<script');
    expect(figure.match(/<image /g)).toHaveLength(HERO.pieces);
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
