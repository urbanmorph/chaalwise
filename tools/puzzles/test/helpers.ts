import { readdirSync, readFileSync, statSync } from 'node:fs';
import { createServer, type IncomingHttpHeaders } from 'node:http';
import type { AddressInfo } from 'node:net';
import { join, relative } from 'node:path';
import { zstdCompressSync } from 'node:zlib';
import type { Store } from '../src/store.ts';

export const FIXTURE_CSV = readFileSync(new URL('./fixtures/puzzles.csv', import.meta.url));
export const FIXTURE_ROWS = FIXTURE_CSV.toString().trimEnd().split('\n').length - 1;

/**
 * Compresses like the Lichess file (pzstd): each zstd frame preceded by a skippable frame giving
 * its size. Node's own zstd decoder stops after the first frame of such a file.
 */
export function multiFrame(csv: Buffer, parts = 3) {
  const lines = csv.toString().split(/(?<=\n)/);
  const per = Math.ceil(lines.length / parts);
  const out: Buffer[] = [];
  for (let i = 0; i < lines.length; i += per) {
    const frame = zstdCompressSync(Buffer.from(lines.slice(i, i + per).join('')));
    const skippable = Buffer.alloc(12);
    skippable.writeUInt32LE(0x184d2a50, 0);
    skippable.writeUInt32LE(4, 4);
    skippable.writeUInt32LE(frame.length, 8);
    out.push(skippable, frame);
  }
  return Buffer.concat(out);
}

/** Serves bytes like database.lichess.org: HEAD, ETag, and Range with If-Range. */
export async function serve(body: Buffer = multiFrame(FIXTURE_CSV), etag = '"v1"') {
  const state = { body, etag, cutAfter: 0, gets: [] as IncomingHttpHeaders[], heads: 0 };
  const server = createServer((req, res) => {
    const headers = { etag: state.etag, 'accept-ranges': 'bytes', 'content-type': 'application/octet-stream' };
    if (req.method === 'HEAD') {
      state.heads++;
      res.writeHead(200, { ...headers, 'content-length': state.body.length }).end();
      return;
    }
    state.gets.push(req.headers);
    const range = /^bytes=(\d+)-$/.exec(req.headers.range ?? '');
    const fresh = !req.headers['if-range'] || req.headers['if-range'] === state.etag;
    const start = range && fresh ? Number(range[1]) : 0;
    const part = state.body.subarray(start);
    res.writeHead(start ? 206 : 200, { ...headers, 'content-length': part.length });
    if (state.cutAfter) {
      // Drop the connection part-way, as a flaky network or a killed runner would.
      const cut = state.cutAfter;
      state.cutAfter = 0;
      res.write(part.subarray(0, cut), () => setTimeout(() => res.destroy(), 20));
      return;
    }
    res.end(part);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/lichess_db_puzzle.csv.zst`;
  return { url, state, close: () => new Promise((resolve) => server.close(resolve)) };
}

/** A clock that moves one second each time it is read: the pipeline reads it once per row. */
export function steppingClock(stepMs = 1000, onRead?: (reads: number) => void) {
  let t = 0;
  let reads = 0;
  return () => {
    onRead?.(++reads);
    return (t += stepMs);
  };
}

/** Wraps a store to record puts, and to drop every put after the first `keep` (a process killed with no exit save). */
export function recording(inner: Store, keep = Infinity) {
  const puts: { key: string; body: Uint8Array }[] = [];
  const store: Store = {
    name: inner.name,
    list: (prefix) => inner.list(prefix),
    get: (key) => inner.get(key),
    async put(key, body, type) {
      puts.push({ key, body });
      if (puts.length <= keep) await inner.put(key, body, type);
    },
  };
  return { store, puts };
}

/** Every file under a directory, by relative path, with its contents. */
export function snapshot(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (d: string) => {
    for (const name of readdirSync(d).sort()) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else out[relative(dir, p)] = readFileSync(p, 'utf8');
    }
  };
  walk(dir);
  return out;
}

export function mtimes(dir: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const path of Object.keys(snapshot(dir))) out[path] = statSync(join(dir, path)).mtimeMs;
  return out;
}
