import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

/**
 * `pnpm lint:prose` lints the prose in Markdown front matter (lesson steps, reference
 * summaries and answers, tracks) with tools/vale/front-matter.mjs. Needs Vale on the PATH,
 * as in CI; skipped elsewhere without it.
 */
const SCRIPT = new URL('../../../tools/vale/front-matter.mjs', import.meta.url).pathname;
const hasVale = spawnSync('vale', ['--version']).status === 0;
const dir = mkdtempSync(join(tmpdir(), 'chaalwise-prose-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const lesson = (text: string, situation = 'I have to choose') => `---
title: A lesson
summary: Two steps.
game: strategy
steps:
  - kind: read
    id: intro
    text: ${text}
  - ask: chess/fork/knight-takes-two
  - kind: plan
    id: plan
    prompt: When will you use it?
    situations:
      - ${situation}
      - I am about to send an email
    action: I will look at three options
---

The body: a colon here is fine, and so is a body with no YAML in it.
`;

const lint = (files: Record<string, string>) => {
  const root = mkdtempSync(join(dir, 'content-'));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(join(root, path, '..'), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  const run = spawnSync('node', [SCRIPT, root], { encoding: 'utf8' });
  return { status: run.status, out: run.stdout + run.stderr, root };
};

describe.skipIf(!hasVale && !process.env.CI)('linting the prose in front matter', () => {
  it('passes plain front matter', () => {
    const { status, out } = lint({ 'lessons/strategy/plain.md': lesson('Look at three moves before you choose one.') });
    expect(out).not.toMatch(/error/);
    expect(status).toBe(0);
  });

  it("catches a planted error in a lesson step's text, at its line in the lesson", () => {
    const { status, out, root } = lint({ 'lessons/strategy/planted.md': lesson('Utilise three options.') });
    expect(status).toBe(1);
    expect(out).toContain(`${join(root, 'lessons/strategy/planted.md')}:8:11`);
    expect(out).toContain('Chaalwise.PlainWords');
  });

  it("catches an error in a plan's situations and in a reference entry's answers", () => {
    const { status, out } = lint({
      'lessons/strategy/plan.md': lesson('Look at three.', 'I win the jackpot'),
      'reference/strategy/entry.md': `---
term: Fork
summary: One move, two threats.
faq:
  - q: What is a fork?
    a: A move that attacks two things at once! Count both.
---
`,
    });
    expect(status).toBe(1);
    expect(out).toMatch(/plan\.md:14:\d+ .*Chaalwise\.Points/);
    expect(out).toMatch(/entry\.md:6:\d+ .*Chaalwise\.Exclamation/);
  });

  it('skips Markdown with no front matter', () => {
    const { status } = lint({ 'notes.md': 'Utilise nothing here: the body is linted by vale.ini.\n' });
    expect(status).toBe(0);
  });
});
