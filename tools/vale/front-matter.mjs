// Lints the prose in Markdown front matter: lesson steps, reference summaries and answers, tracks.
// Vale lints a Markdown file's body and title, not the rest of its front matter. So this copies each front matter,
// line for line, into a YAML file of its own, lints those with the FrontMatter view (front-matter.ini), and reports
// each alert at its line in the Markdown file. Usage: node tools/vale/front-matter.mjs <dir>… (needs `vale` on the PATH)
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';

const CONFIG = new URL('front-matter.ini', import.meta.url).pathname;

/** The front matter of a Markdown file, from its opening `---` to the line before the closing one, or undefined. */
function frontMatter(markdown) {
  const lines = markdown.split('\n');
  if (lines[0].trim() !== '---') return undefined;
  const end = lines.indexOf('---', 1);
  return end > 0 ? lines.slice(0, end).join('\n') + '\n' : undefined;
}

/** Copies the front matter of every Markdown file in `dirs` into `work`; returns each copy's path, back to its source. */
function copyFrontMatter(dirs, work) {
  const sources = new Map();
  dirs.forEach((dir, i) => {
    for (const file of readdirSync(dir, { recursive: true }).map(String)) {
      if (!file.endsWith('.md')) continue;
      const path = join(dir, file);
      const yaml = frontMatter(readFileSync(path, 'utf8'));
      if (!yaml) continue;
      const copy = join(String(i), `${file}.yaml`);
      mkdirSync(dirname(join(work, copy)), { recursive: true });
      writeFileSync(join(work, copy), yaml);
      const shown = relative(process.cwd(), path);
      sources.set(copy, shown.startsWith('..') ? path : shown);
    }
  });
  return sources;
}

/** Lints the copies and prints each alert at its source: exit code 0 when clean, 1 with alerts, 2 if Vale fails. */
function lint(work, sources) {
  const vale = spawnSync('vale', [`--config=${CONFIG}`, '--output=JSON', '.'], { cwd: work, encoding: 'utf8' });
  // Vale exits 1 when it finds alerts; anything else is a failure to run.
  if (vale.error || (vale.status !== 0 && vale.status !== 1)) {
    console.error(vale.error?.message || vale.stderr || vale.stdout);
    return 2;
  }
  const alerts = Object.entries(JSON.parse(vale.stdout || '{}')).flatMap(([copy, list]) =>
    list.map((a) => `${sources.get(copy) ?? copy}:${a.Line}:${a.Span[0]} ${a.Severity} ${a.Message} (${a.Check})`),
  );
  for (const line of alerts) console.log(line);
  if (alerts.length) console.log(`\n${alerts.length} alert(s) in front matter.`);
  return alerts.length ? 1 : 0;
}

const work = mkdtempSync(join(tmpdir(), 'chaalwise-front-matter-'));
try {
  const dirs = process.argv.slice(2).map((d) => resolve(d));
  process.exitCode = lint(work, copyFrontMatter(dirs, work));
} finally {
  rmSync(work, { recursive: true, force: true });
}
