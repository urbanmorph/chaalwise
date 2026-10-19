// JavaScript budgets per page, measured on the built site (plan, section 12).
// Usage: node scripts/budget.mjs dist   (exits 1 if any page is over budget)
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

/** Pages with a chess board: lessons and the review. Everything else is a reading page. */
const BOARD_PAGES = /^\/(chess\/[^/]+|review)\/$/;

/** @param {string} page */
export const budgetFor = (page) => (BOARD_PAGES.test(page) ? 80_000 : 30_000);

const gzip = (/** @type {string | Buffer} */ text) => gzipSync(text, { level: 9 }).length;

/** Static imports only: code behind a dynamic import() loads on demand and is not counted. */
const STATIC_IMPORT = /(?:^|[;}\s])import\s*(?:[\w$*{}\s,]+from\s*)?["']([^"']+\.js)["']/g;

/** A script and everything it statically imports, as paths under dist. */
function closure(dist, path, seen) {
  if (seen.has(path)) return;
  seen.add(path);
  const code = readFileSync(join(dist, path), 'utf8');
  for (const [, spec] of code.matchAll(STATIC_IMPORT)) {
    closure(dist, `/${relative(dist, resolve(join(dist, dirname(path)), spec))}`, seen);
  }
}

/**
 * Every page's JavaScript, compressed: inline scripts, module scripts and the
 * islands' components and renderers, with all their static imports.
 * @param {string} dist
 */
export function measure(dist) {
  const html = readdirSync(dist, { recursive: true })
    .map(String)
    .filter((f) => f.endsWith('.html'));
  return html.map((file) => {
    const page = `/${file.replace(/index\.html$/, '')}`;
    const source = readFileSync(join(dist, file), 'utf8');
    const seen = new Set();
    const urls = [
      ...source.matchAll(/<script[^>]+src="(\/[^"]+\.js)"/g),
      ...source.matchAll(/(?:component|renderer)-url="(\/[^"]+\.js)"/g),
    ].map((m) => m[1]);
    for (const url of urls) closure(dist, url, seen);
    const inline = [...source.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('');
    const bytes = gzip(inline) + [...seen].reduce((n, f) => n + gzip(readFileSync(join(dist, f))), 0);
    return { page, bytes, budget: budgetFor(page), files: [...seen] };
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const pages = measure(resolve(process.argv[2] ?? 'dist'));
  let over = 0;
  for (const { page, bytes, budget } of pages.sort((a, b) => b.bytes - a.bytes)) {
    const flag = bytes > budget ? 'OVER' : 'ok';
    if (bytes > budget) over++;
    console.log(`${flag.padEnd(4)} ${(bytes / 1000).toFixed(1).padStart(6)} / ${budget / 1000} KB  ${page}`);
  }
  process.exit(over ? 1 : 0);
}
