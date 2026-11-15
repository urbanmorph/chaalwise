import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { COUNT_KEY } from '../src/lib/count';
import { LABS } from '../src/lib/labs/labs';

/** These tests read the built site, not the source. Run `pnpm build` first. */
const DIST = new URL('../dist/', import.meta.url).pathname;
if (!existsSync(join(DIST, 'index.html'))) throw new Error('No build found: run `pnpm build` first.');
const page = (path: string) => readFileSync(join(DIST, path, 'index.html'), 'utf8');
const scripts = readdirSync(join(DIST, '_astro')).filter((f) => f.endsWith('.js'));
/** The built code of a component, by its name. */
const chunk = (name: string) => {
  const file = scripts.find((f) => f.startsWith(`${name}.`));
  if (!file) throw new Error(`no built chunk for ${name}`);
  return readFileSync(join(DIST, '_astro', file), 'utf8');
};

describe('the decision journal stays on the device', () => {
  it('has no code that sends anything: no beacon, no request, no address on the site', () => {
    for (const name of ['Journal', 'LookBack', 'Reflection']) {
      const code = chunk(name);
      expect(code, name).not.toMatch(/sendBeacon|fetch\(|XMLHttpRequest|\/api\/|count\(/);
    }
  });

  it('is kept on the progress page, where an entry is written, and its export', () => {
    const html = page('progress');
    expect(html).toContain('id="journal"');
    expect(html).toContain('Decision journal');
  });

  it('asks on the review page about a decision once its date comes', () => {
    expect(page('review')).toMatch(/component-url="\/_astro\/LookBack\.[^"]+\.js"/);
    expect(chunk('LookBack')).toContain('/skills/review-calmly/');
  });

  it('is offered from the plan step', () => {
    expect(chunk('PlanStep')).toContain('/progress/#journal');
  });

  it('offers a short written reflection after every lab', () => {
    for (const lab of LABS)
      expect(page(`labs/${lab.slug}`), lab.slug).toMatch(/component-url="\/_astro\/Reflection\.[^"]+\.js"/);
  });
});

describe('plan check-ins', () => {
  it('ask first whether the moment was noticed, then whether the plan was acted on', () => {
    const code = chunk('PlanCheckIn');
    expect(code.indexOf('did you notice it?')).toBeGreaterThan(-1);
    expect(code).toContain('Did you act on your plan?');
  });

  it('count only the answer, by one of three names', () => {
    const names = [...chunk('PlanCheckIn').matchAll(/checkin:[a-z-]+/g)].map((m) => m[0]);
    expect(new Set(names)).toEqual(new Set(['checkin:noticed', 'checkin:acted', 'checkin:not-noticed']));
    for (const name of names) expect(name).toMatch(COUNT_KEY);
  });
});
