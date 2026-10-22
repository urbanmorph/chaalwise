import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const dist = (file: string) => readFileSync(new URL(`../dist/${file}`, import.meta.url), 'utf8');

describe('the chess path: enough to play, then going deeper', () => {
  it('marks stages 4 to 7 as going deeper, after your first games, on the chess page', () => {
    const html = dist('chess/index.html');
    const deeper = html.indexOf('Going deeper');
    expect(deeper).toBeGreaterThan(html.indexOf('Opening principles'));
    expect(deeper).toBeLessThan(html.indexOf('Tactics'));
    expect(html).toContain('href="/play-elsewhere/"');
  });

  it('does the same in the rail beside every chess lesson, and nowhere else', () => {
    const rail = (file: string) =>
      dist(file).match(/<nav class="rail"[\s\S]*?<\/nav>|<aside[\s\S]*?<\/aside>/)?.[0] ?? '';
    const chess = rail('chess/fork/index.html');
    expect(chess.indexOf('Going deeper')).toBeGreaterThan(chess.indexOf('Opening principles'));
    expect(chess.indexOf('Going deeper')).toBeLessThan(chess.indexOf('Tactics'));
    expect(dist('poker/index.html')).not.toContain('Going deeper');
    expect(rail('poker/outs-and-odds/index.html')).not.toContain('Going deeper');
  });
});
