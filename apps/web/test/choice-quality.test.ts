import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

/**
 * Multiple choice teaches only when every option has to be thought about:
 * each wrong option is a tempting mistake with its own reason, and nothing on
 * the surface gives the answer away.
 */
type Choice = { kind: 'choice'; id: string; options: string[]; answer: number; feedback?: string[] };

const content = new URL('../src/content/', import.meta.url);
const frontmatter = (file: URL) =>
  parse(readFileSync(file, 'utf8').split(/^---$/m)[1]!) as { steps?: Choice[]; try?: Choice[] };
const files = (dir: string) =>
  readdirSync(new URL(dir, content), { recursive: true })
    .map(String)
    .filter((f) => f.endsWith('.md'))
    .map((f) => ({ id: `${dir}${f.replace('.md', '')}`, url: new URL(`${dir}${f}`, content) }));

const choices = [...files('lessons/'), ...files('reference/')].flatMap(({ id, url }) => {
  const data = frontmatter(url);
  return [...(data.steps ?? []), ...(data.try ?? [])]
    .filter((s) => s.kind === 'choice')
    .map((step) => ({ where: `${id}#${step.id}`, step }));
});

describe('every multiple-choice question', () => {
  it('exists in numbers worth checking', () => {
    expect(choices.length).toBeGreaterThan(40);
  });

  it('says why each wrong option fails', () => {
    const missing = choices.filter(({ step }) => !step.feedback).map((c) => c.where);
    expect(missing).toEqual([]);
  });

  it('does not give the answer away by being much longer than every wrong option', () => {
    const giveaways = choices
      .filter(({ step }) => {
        const right = step.options[step.answer]!.length;
        const longestWrong = Math.max(...step.options.filter((_, i) => i !== step.answer).map((o) => o.length));
        return right > longestWrong * 1.6 && right - longestWrong > 15;
      })
      .map((c) => c.where);
    expect(giveaways).toEqual([]);
  });
});
