import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const dist = (file: string) => readFileSync(new URL(`../dist/${file}`, import.meta.url), 'utf8');

describe('play it elsewhere', () => {
  const html = dist('play-elsewhere/index.html');
  const section = (id: string) => html.match(new RegExp(`<section[^>]*id="${id}"[\\s\\S]*?</section>`))![0];

  it('says where to play chess for free, online and over the board, crediting the sites it names', () => {
    const chess = section('chess');
    expect(chess).toContain('href="https://lichess.org/"');
    expect(chess).toMatch(/club/i);
  });

  it('keeps poker to free home games for points, with no links out at all', () => {
    const poker = section('poker');
    expect(poker).toMatch(/points/);
    expect(poker).not.toMatch(/chips/i);
    expect(poker).not.toMatch(/href="https?:/);
  });

  it('comes after the openings, not after tactics and endgames: enough to play, then come back for more', () => {
    const lesson = readFileSync(new URL('../src/content/lessons/chess/play-a-real-game.md', import.meta.url), 'utf8');
    expect(lesson).toMatch(/^stage: 3$/m);
    expect(html).toMatch(/the first \d+ chess lessons/);
  });

  it('is reached from the lesson that ends the chess path, and from the home page', () => {
    expect(dist('chess/play-a-real-game/index.html')).toContain('href="/play-elsewhere/"');
    expect(dist('index.html')).toContain('href="/play-elsewhere/"');
  });
});
