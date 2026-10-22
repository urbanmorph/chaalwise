// The offline worker (src/sw/sw.ts), bundled and run for real in a sandbox:
// an in-memory Cache Storage and a network the test switches on and off.
import { build } from 'esbuild';
import { runInNewContext } from 'node:vm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

const ORIGIN = 'https://chaalwise.com';
const APP_JS = '/_astro/Board.CkF7_x-a.js';
const OLD_JS = '/_astro/Old.B2mbPMb4.js';
const KEY = ['/', '/chess/', '/offline/'];
const REST = ['/chess/board/', '/chess/hanging/', '/reference/fork/'];

let source = '';
beforeAll(async () => {
  const out = await build({
    entryPoints: [new URL('../src/sw/sw.ts', import.meta.url).pathname],
    bundle: true,
    format: 'iife',
    write: false,
    logLevel: 'silent',
  });
  source = out.outputFiles[0]!.text;
});

const typed = (body: string, type: string, status = 200) =>
  new Response(body, { status, headers: { 'content-type': type } });
const html = (body: string, status = 200) => typed(body, 'text/html; charset=utf-8', status);

// In a worker, a relative URL resolves against the worker's origin.
class WorkerRequest extends Request {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(typeof input === 'string' ? new URL(input, ORIGIN) : input, init);
  }
}
type Handler = (event: Record<string, unknown>) => void;
type Stores = Map<string, Map<string, Response>>;

function makeWorker(version: string, assets: string[], stores: Stores = new Map()) {
  const keyOf = (r: Request | string) => new URL(typeof r === 'string' ? r : r.url, ORIGIN).href;
  // `deploy` is what the server has; `down` lists paths the server fails (5xx); `missing` ones it has lost.
  const state = {
    online: true,
    fetched: [] as string[],
    deploy: version,
    down: new Set<string>(),
    missing: new Set<string>(),
  };
  const site = (path: string): Response | undefined => {
    if ([...KEY, ...REST].includes(path)) return html(`${path} ${state.deploy}`);
    if (path === APP_JS) return typed('board();', 'text/javascript');
    if (path === OLD_JS) return typed('old();', 'text/javascript');
  };
  async function net(input: Request | string): Promise<Response> {
    const req = typeof input === 'string' ? new WorkerRequest(input) : input;
    const path = new URL(req.url).pathname;
    state.fetched.push(path);
    if (!state.online) throw new TypeError('Failed to fetch');
    if (state.down.has(path)) return html('<h1>502 Bad gateway</h1>', 502);
    return (!state.missing.has(path) && site(path)) || html('not found', 404);
  }
  const open = async (name: string) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name)!;
    return {
      match: async (r: Request | string) => store.get(keyOf(r))?.clone(),
      put: async (r: Request | string, res: Response) => void store.set(keyOf(r), res.clone()),
      delete: async (r: Request | string) => store.delete(keyOf(r)),
      keys: async () => [...store.keys()].map((u) => new Request(u)),
    };
  };
  const caches = {
    open,
    keys: async () => [...stores.keys()],
    delete: async (name: string) => stores.delete(name),
    match: async (r: Request | string, opts?: { cacheName?: string }) => {
      for (const n of opts?.cacheName ? [opts.cacheName] : [...stores.keys()]) {
        const hit = stores.get(n)?.get(keyOf(r));
        if (hit) return hit.clone();
      }
      return undefined;
    },
  };
  const handlers: Record<string, Handler> = {};
  const self = {
    __PRECACHE__: { version, pages: KEY, rest: REST, assets },
    location: new URL(`${ORIGIN}/sw.js`),
    addEventListener: (type: string, fn: Handler) => (handlers[type] = fn),
    skipWaiting: async () => {},
    clients: { claim: async () => {} },
    registration: { navigationPreload: { enable: async () => {} } },
  };
  runInNewContext(source, { self, caches, fetch: net, Request: WorkerRequest, Response, URL, Promise, Set, console });

  async function lifecycle(type: 'install' | 'activate') {
    let done: Promise<unknown> = Promise.resolve();
    handlers[type]!({ waitUntil: (p: Promise<unknown>) => (done = p) });
    await done;
  }
  /** Asks the worker to save the other pages; resolves with its reply once it has. */
  async function fill() {
    const replies: unknown[] = [];
    let done: Promise<unknown> = Promise.resolve();
    handlers.message!({
      data: 'fill',
      ports: [{ postMessage: (m: unknown) => replies.push(m) }],
      waitUntil: (p: Promise<unknown>) => (done = p),
    });
    await done;
    return replies;
  }
  /** Dispatches a fetch; the response, or null if the worker let it through. */
  async function request(url: string, init: RequestInit & { mode?: string } = {}): Promise<Response | null> {
    // Only a browser can make a navigate request, so the mode is set after.
    const { mode, ...rest } = init;
    const req = new Request(new URL(url, ORIGIN), rest);
    if (mode) Object.defineProperty(req, 'mode', { value: mode });
    const event = { responded: null as Promise<Response> | null };
    const waits: Promise<unknown>[] = [];
    handlers.fetch!({
      request: req,
      preloadResponse: Promise.resolve(undefined),
      respondWith: (p: Promise<Response>) => (event.responded = p),
      waitUntil: (p: Promise<unknown>) => waits.push(p),
    });
    const res = event.responded ? await event.responded : null;
    await Promise.all(waits);
    return res;
  }
  const page = (path: string) => request(path, { mode: 'navigate' });
  const saved = (cache: string) => [...(stores.get(cache)?.keys() ?? [])].map((u) => new URL(u).pathname).sort();
  return { state, stores, saved, lifecycle, fill, request, page };
}

const text = async (r: Promise<Response | null>) => (await r)!.text();

describe('chaalwise offline worker', () => {
  let w: ReturnType<typeof makeWorker>;
  beforeEach(async () => {
    w = makeWorker('v1', [APP_JS, OLD_JS]);
    await w.lifecycle('install');
    await w.lifecycle('activate');
  });

  it('installs with the key pages and build files only, so it is ready in seconds', () => {
    expect(w.saved('pages-v1')).toEqual([...KEY].sort());
    expect(w.saved('assets-v1')).toEqual([OLD_JS, APP_JS].sort());
    expect(w.state.fetched.filter((p) => REST.includes(p))).toEqual([]);
  });

  it('then saves every other page in the background, and says when it is done', async () => {
    expect(await w.fill()).toEqual(['filled']);
    expect(w.saved('pages-v1')).toEqual([...KEY, ...REST].sort());
    w.state.online = false;
    expect(await text(w.page('/reference/fork/'))).toBe('/reference/fork/ v1');
  });

  it('a page that fails to save is skipped, not the whole lot, and tried again next time', async () => {
    w.state.down.add('/chess/board/');
    await w.fill();
    expect(w.saved('pages-v1')).toEqual([...KEY, '/chess/hanging/', '/reference/fork/'].sort());
    w.state.down.clear();
    w.state.fetched = [];
    await w.fill();
    // Only the page still missing is fetched again.
    expect(w.state.fetched).toEqual(['/chess/board/']);
    expect(w.saved('pages-v1')).toContain('/chess/board/');
  });

  it('online, pages come from the network, so a deploy shows at once', async () => {
    w.state.deploy = 'v2';
    expect(await text(w.page('/chess/'))).toBe('/chess/ v2');
  });

  it('a server error on a saved page shows the saved copy instead', async () => {
    w.state.down.add('/chess/');
    expect(await text(w.page('/chess/'))).toBe('/chess/ v1');
  });

  it('a server error on a page that is not saved shows the server’s own error', async () => {
    w.state.down.add('/chess/board/');
    const res = (await w.page('/chess/board/'))!;
    expect(res.status).toBe(502);
  });

  it('offline, a page that is not saved gets the styled offline page, as a 503', async () => {
    w.state.online = false;
    const res = (await w.page('/chess/not-a-lesson/'))!;
    expect(res.status).toBe(503);
    expect(res.headers.get('content-type')).toMatch(/^text\/html/);
    expect(await res.text()).toBe('/offline/ v1');
  });

  it('build files come from the cache; a copy of the wrong type is refetched', async () => {
    w.state.fetched = [];
    expect(await text(w.request(APP_JS))).toBe('board();');
    expect(w.state.fetched).toEqual([]);
    w.stores.get('assets-v1')!.set(`${ORIGIN}${APP_JS}`, html('<!doctype html>'));
    expect(await text(w.request(APP_JS))).toBe('board();');
    expect(w.state.fetched).toEqual([APP_JS]);
  });

  it('never touches POSTs, other sites, or files that are not content-hashed', async () => {
    expect(await w.request('/chess/', { method: 'POST', body: 'x', mode: 'navigate' })).toBeNull();
    expect(await w.request('https://static.cloudflareinsights.com/beacon.min.js')).toBeNull();
    expect(await w.request('/manifest.webmanifest')).toBeNull();
  });

  describe('after a deploy', () => {
    const deploy = async (version: string, assets: string[]) => {
      const next = makeWorker(version, assets, w.stores);
      next.state.missing.add(OLD_JS); // the server keeps only the new deploy's files
      await next.lifecycle('install');
      await next.lifecycle('activate');
      return next;
    };

    it('a tab still on the old version can load its old code', async () => {
      const next = await deploy('v2', [APP_JS]);
      next.state.fetched = [];
      expect(await text(next.request(OLD_JS))).toBe('old();');
      expect(next.state.fetched).toEqual([]);
    });

    it('reuses unchanged build files instead of downloading them again', async () => {
      const next = makeWorker('v2', [APP_JS], w.stores);
      await next.lifecycle('install');
      expect(next.state.fetched).not.toContain(APP_JS);
      expect(next.saved('assets-v2')).toEqual([APP_JS]);
    });

    it('keeps the build files of this version and the one before, and the pages of this version only', async () => {
      await deploy('v2', [APP_JS]);
      await deploy('v3', [APP_JS]);
      expect([...w.stores.keys()].sort()).toEqual(['assets-v2', 'assets-v3', 'pages-v3']);
    });

    it('moves on from the single build-file cache of earlier workers, keeping it as the version before', async () => {
      const stores: Stores = new Map([
        ['assets', new Map([[`${ORIGIN}${OLD_JS}`, typed('old();', 'text/javascript')]])],
      ]);
      const first = makeWorker('v2', [APP_JS], stores);
      first.state.missing.add(OLD_JS);
      await first.lifecycle('install');
      await first.lifecycle('activate');
      expect(await text(first.request(OLD_JS))).toBe('old();');
      const second = makeWorker('v3', [APP_JS], stores);
      await second.lifecycle('install');
      await second.lifecycle('activate');
      expect([...stores.keys()].filter((k) => k.startsWith('assets')).sort()).toEqual(['assets-v2', 'assets-v3']);
    });
  });
});
