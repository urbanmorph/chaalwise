// A static server for end-to-end tests that behaves like Cloudflare's static
// assets for what the tests rely on: `_headers`, `_redirects` (static rules:
// exact paths, a status, the query kept), directory pages with a
// trailing-slash redirect, and the 404 page. `/__deploy/<name>` switches the
// served build, which is how a test simulates a deploy. Test use only.
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const [port, buildsDir] = process.argv.slice(2);
let root = join(buildsDir, 'A');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
};

/** `_headers` rules as [pattern, {header: value}], with `*` matching any suffix. */
function headerRules() {
  const rules = [];
  for (const line of readFileSync(join(root, '_headers'), 'utf8').split('\n')) {
    if (line.startsWith('/')) rules.push([line.trim(), {}]);
    else if (line.trim() && rules.length) {
      const [name, ...value] = line.trim().split(':');
      rules.at(-1)[1][name] = value.join(':').trim();
    }
  }
  return rules;
}

/** `_redirects` rules as {path: [target, status]}: `/old /new 301` per line, `#` for comments. */
function redirectRules() {
  const file = join(root, '_redirects');
  if (!existsSync(file)) return {};
  const rules = {};
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const [from, to, status = '302'] = line.trim().split(/\s+/);
    if (from?.startsWith('/') && to) rules[from] ??= [to, Number(status)];
  }
  return rules;
}

const matches = (pattern, path) => (pattern.endsWith('*') ? path.startsWith(pattern.slice(0, -1)) : pattern === path);

createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const deploy = url.pathname.match(/^\/__deploy\/(\w+)$/);
  if (deploy) {
    root = join(buildsDir, deploy[1]);
    res.end(`serving ${deploy[1]}`);
    return;
  }

  const redirect = redirectRules()[url.pathname];
  if (redirect) {
    const [to, status] = redirect;
    res.writeHead(status, { location: to.startsWith('/') ? `${to}${url.search}` : to }).end();
    return;
  }

  let path = normalize(decodeURIComponent(url.pathname));
  // Like Cloudflare's html_handling: /x/index.html -> /x/, /x.html -> /x
  if (path.endsWith('.html')) {
    const pretty = path.endsWith('/index.html') ? path.slice(0, -10) : path.slice(0, -5);
    res.writeHead(307, { location: `${pretty}${url.search}` }).end();
    return;
  }
  let file = join(root, path);
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!path.endsWith('/')) {
      res.writeHead(307, { location: `${path}/${url.search}` }).end();
      return;
    }
    file = join(file, 'index.html');
  } else if (!extname(path) && existsSync(join(root, path, 'index.html'))) {
    res.writeHead(307, { location: `${path}/${url.search}` }).end();
    return;
  }

  let status = 200;
  if (!existsSync(file)) {
    status = 404;
    file = join(root, '404.html');
    path = '/404.html';
  }

  const headers = { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' };
  for (const [pattern, values] of headerRules()) {
    if (matches(pattern, path)) Object.assign(headers, values);
  }
  res.writeHead(status, headers);
  createReadStream(file).pipe(res);
}).listen(Number(port), () => console.log(`e2e server on ${port}, serving ${root}`));
