import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DRILLS } from '../src/lib/drill-list';
import { LICHESS_DRILLS, LICHESS_LESSONS } from '../src/lib/lichess';
import { THEMES } from '../src/lib/puzzles';

const dist = (file: string) => readFileSync(new URL(`../dist/${file}`, import.meta.url), 'utf8');
const chessLessons = readdirSync(new URL('../src/content/lessons/chess/', import.meta.url)).map((f) =>
  f.replace('.md', ''),
);
const more = (html: string) => html.match(/<p class="lichess"[\s\S]*?<\/p>/)?.[0] ?? '';

describe('more practice on Lichess, where it helps', () => {
  it('points every chess lesson that has more to practise to the right Lichess page', () => {
    for (const id of Object.keys(LICHESS_LESSONS)) expect(chessLessons, id).toContain(id.replace('chess/', ''));
    // Only the lesson that sends you off to play has nothing more to practise there.
    expect(chessLessons.filter((l) => !LICHESS_LESSONS[`chess/${l}`])).toEqual(['play-a-real-game']);
    expect(more(dist('chess/fork/index.html'))).toContain('href="https://lichess.org/training/fork"');
    expect(more(dist('chess/coordinates/index.html'))).toContain('href="https://lichess.org/training/coordinate"');
    expect(more(dist('chess/rook-mate/index.html'))).toContain('href="https://lichess.org/practice"');
  });

  it('follows each drill with its Lichess trainer', () => {
    expect(DRILLS.map((d) => d.id).filter((id) => !LICHESS_DRILLS[id])).toEqual([]);
    const html = dist('chess/drills/index.html');
    for (const d of DRILLS) {
      const section = html.match(new RegExp(`<section id="${d.id}"[\\s\\S]*?</section>`))![0];
      expect(more(section), d.id).toContain(`href="${LICHESS_DRILLS[d.id]!.href}"`);
    }
  });

  it('offers each puzzle theme’s own Lichess puzzles from the puzzle page', () => {
    const html = dist('chess/puzzles/index.html');
    expect(html).toContain('href="https://lichess.org/training/themes"');
    expect(THEMES.length).toBeGreaterThan(5);
  });

  it('only ever links to Lichess pages, credited by name, never as ours', () => {
    for (const { href, label } of [...Object.values(LICHESS_LESSONS), ...Object.values(LICHESS_DRILLS)]) {
      expect(href).toMatch(/^https:\/\/lichess\.org\//);
      expect(label).not.toMatch(/chaalwise/i);
    }
  });
});
