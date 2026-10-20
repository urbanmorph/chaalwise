import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const dist = (file: string) => readFileSync(new URL(`../dist/${file}`, import.meta.url), 'utf8');
const slugs = (game: string) =>
  readdirSync(new URL(`../src/content/reference/${game}/`, import.meta.url)).map((f) => f.replace('.md', ''));
const section = (html: string) => html.match(/<section class="try[\s\S]*?<\/section>/)?.[0];

describe('a reference entry you can try', () => {
  it('every strategy idea has a try-it-yourself section, never just an explanation', () => {
    for (const slug of slugs('strategy')) {
      const html = dist(`reference/strategy/${slug}/index.html`);
      expect(section(html), slug).toContain('Try it yourself');
    }
  });

  it('draws the first question at build time, so the page has something to look at before any script', () => {
    const html = section(dist('reference/strategy/weakest-link/index.html'))!;
    expect(html).toContain('<svg class="diagram"');
    expect(html).toMatch(/<button[^>]*>\s*Try it\s*</);
    expect(html).toMatch(/data-steps="\[/);
  });

  it('counts the answers towards the skill the idea trains, when the profile measures it', () => {
    expect(section(dist('reference/strategy/weakest-link/index.html'))).toContain('data-measures="plan-long"');
    // Composure is not measured yet, so its answers would show up nowhere.
    expect(section(dist('reference/strategy/cool-head/index.html'))).not.toContain('data-measures');
  });

  it('offers more practice on the skill’s course, when the course has practice', () => {
    expect(section(dist('reference/strategy/weakest-link/index.html'))).toContain('href="/skills/plan-long/"');
    // Composure has no practice yet: nowhere to send the learner.
    expect(section(dist('reference/strategy/cool-head/index.html'))).not.toContain('href="/skills/composure/"');
  });

  it('brings its questions back in review, so trying them once is not the last time', () => {
    const review = dist('review/index.html');
    expect(review).toContain('reference/strategy/sunk-cost/knight');
    // Counted towards the track only where the profile measures it.
    expect(review).toMatch(
      /reference\/strategy\/weakest-link\/which-piece&quot;:\[0,\{[^}]*measures&quot;:\[0,&quot;plan-long/,
    );
  });
});
