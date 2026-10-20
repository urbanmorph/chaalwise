import { AwsClient } from 'aws4fetch';
import { mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { md5 } from './hash.ts';

/** Durable storage for checkpoints and outputs: R2 in production, a local directory in tests and dry runs. */
export interface Store {
  readonly name: string;
  /** Every key under a prefix, with the MD5 of its content. */
  list(prefix: string): Promise<Map<string, string>>;
  get(key: string): Promise<Uint8Array | null>;
  put(key: string, body: Uint8Array, contentType?: string): Promise<void>;
}

/** Writes through a temporary file and a rename, so a kill never leaves half a file. */
export function writeAtomic(path: string, body: Uint8Array) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, body);
  renameSync(tmp, path);
}

export class LocalStore implements Store {
  readonly name: string;
  private readonly dir: string;
  constructor(dir: string) {
    this.dir = dir;
    this.name = `local directory ${dir}`;
  }

  async list(prefix: string) {
    const out = new Map<string, string>();
    const walk = (d: string) => {
      for (const entry of readdirSync(d, { withFileTypes: true })) {
        const p = join(d, entry.name);
        if (entry.isDirectory()) walk(p);
        else if (!entry.name.endsWith('.tmp')) {
          const key = relative(this.dir, p).split(sep).join('/');
          if (key.startsWith(prefix)) out.set(key, md5(readFileSync(p)));
        }
      }
    };
    if (statSync(this.dir, { throwIfNoEntry: false })?.isDirectory()) walk(this.dir);
    return out;
  }

  async get(key: string) {
    try {
      return new Uint8Array(readFileSync(join(this.dir, key)));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw e;
    }
  }

  async put(key: string, body: Uint8Array) {
    writeAtomic(join(this.dir, key), body);
  }
}

export const R2_KEYS = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET'] as const;
export type R2Credentials = Record<(typeof R2_KEYS)[number], string>;
type Fetch = (request: Request) => Promise<Response>;

const unescapeXml = (s: string) =>
  s.replace(/&(quot|amp|lt|gt|apos);/g, (_, e: string) => ({ quot: '"', amp: '&', lt: '<', gt: '>', apos: "'" })[e]!);

/** Cloudflare R2 through its S3-compatible API, signed with the given keys only. */
export class R2Store implements Store {
  readonly name: string;
  private readonly client: AwsClient;
  private readonly base: string;
  private readonly fetchImpl: Fetch;

  constructor(creds: R2Credentials, fetchImpl: Fetch = fetch) {
    this.fetchImpl = fetchImpl;
    this.name = `R2 bucket ${creds.R2_BUCKET}`;
    this.base = `https://${creds.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${creds.R2_BUCKET}`;
    this.client = new AwsClient({
      accessKeyId: creds.R2_ACCESS_KEY_ID,
      secretAccessKey: creds.R2_SECRET_ACCESS_KEY,
      service: 's3',
      region: 'auto',
    });
  }

  private async send(url: string, init: RequestInit = {}, okStatus = [200]) {
    const res = await this.fetchImpl(await this.client.sign(url, init));
    if (!okStatus.includes(res.status)) {
      throw new Error(`R2 ${init.method ?? 'GET'} ${new URL(url).pathname}: ${res.status} ${await res.text()}`);
    }
    return res;
  }

  private url(key: string) {
    return `${this.base}/${key.split('/').map(encodeURIComponent).join('/')}`;
  }

  async list(prefix: string) {
    const out = new Map<string, string>();
    let token: string | undefined;
    do {
      const q = new URLSearchParams({ 'list-type': '2', prefix });
      if (token) q.set('continuation-token', token);
      const xml = await (await this.send(`${this.base}?${q}`)).text();
      for (const [, body] of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
        const key = /<Key>([\s\S]*?)<\/Key>/.exec(body!)?.[1];
        const etag = /<ETag>([\s\S]*?)<\/ETag>/.exec(body!)?.[1];
        if (key && etag) out.set(unescapeXml(key), unescapeXml(etag).replaceAll('"', ''));
      }
      const truncated = /<IsTruncated>true<\/IsTruncated>/.test(xml);
      token = truncated
        ? unescapeXml(/<NextContinuationToken>([\s\S]*?)<\/NextContinuationToken>/.exec(xml)?.[1] ?? '')
        : undefined;
    } while (token);
    return out;
  }

  async get(key: string) {
    const res = await this.send(this.url(key), {}, [200, 404]);
    return res.status === 404 ? null : new Uint8Array(await res.arrayBuffer());
  }

  async put(key: string, body: Uint8Array, contentType = 'application/json') {
    const immutable = /\.[0-9a-f]{12}\.json$/.test(key);
    await this.send(this.url(key), {
      method: 'PUT',
      body,
      headers: {
        'content-type': contentType,
        'cache-control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
      },
    });
  }
}

/**
 * Picks the durable store. R2 is used only when all four R2_* variables are set explicitly; with
 * none set, or on a dry run, everything stays in a local directory. Half-set credentials are an
 * error, never a guess, and wrangler's own login is never read.
 */
export function storeFromEnv(
  env: Record<string, string | undefined>,
  { dryRun, localDir }: { dryRun: boolean; localDir: string },
): { store: Store; why: string } {
  const set = R2_KEYS.filter((k) => env[k]?.trim());
  if (dryRun) return { store: new LocalStore(localDir), why: 'dry run: nothing leaves this machine' };
  if (!set.length) return { store: new LocalStore(localDir), why: 'no R2_* variables set: local only' };
  const missing = R2_KEYS.filter((k) => !set.includes(k));
  if (missing.length) throw new Error(`Not uploading: ${missing.join(' and ')} must be set too (or pass --dry-run).`);
  const creds = Object.fromEntries(R2_KEYS.map((k) => [k, env[k]!.trim()])) as R2Credentials;
  return { store: new R2Store(creds), why: 'R2 credentials set explicitly' };
}
