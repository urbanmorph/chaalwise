import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { md5 } from '../src/hash.ts';
import { LocalStore, R2Store, storeFromEnv } from '../src/store.ts';

const bytes = (s: string) => new TextEncoder().encode(s);
const creds = { R2_ACCOUNT_ID: 'acc', R2_ACCESS_KEY_ID: 'key', R2_SECRET_ACCESS_KEY: 'secret', R2_BUCKET: 'bucket' };

describe('LocalStore', () => {
  it('puts, gets and lists keys with their MD5', async () => {
    const store = new LocalStore(mkdtempSync(join(tmpdir(), 'store-')));
    expect(await store.get('puzzles/a.json')).toBeNull();
    await store.put('puzzles/a.json', bytes('{"a":1}'));
    await store.put('pipeline/c.json', bytes('{}'));
    expect(new TextDecoder().decode((await store.get('puzzles/a.json'))!)).toBe('{"a":1}');
    expect(await store.list('puzzles/')).toEqual(new Map([['puzzles/a.json', md5(bytes('{"a":1}'))]]));
  });
});

describe('storeFromEnv', () => {
  const localDir = mkdtempSync(join(tmpdir(), 'store-'));

  it('stays local without credentials, or on a dry run', () => {
    expect(storeFromEnv({}, { dryRun: false, localDir }).store).toBeInstanceOf(LocalStore);
    expect(storeFromEnv(creds, { dryRun: true, localDir }).store).toBeInstanceOf(LocalStore);
  });

  it('uses R2 only when every R2 variable is set', () => {
    expect(storeFromEnv(creds, { dryRun: false, localDir }).store).toBeInstanceOf(R2Store);
  });

  it('refuses half-set credentials rather than guessing', () => {
    expect(() => storeFromEnv({ R2_ACCOUNT_ID: 'acc', R2_BUCKET: 'b' }, { dryRun: false, localDir })).toThrow(
      /R2_ACCESS_KEY_ID.*R2_SECRET_ACCESS_KEY/,
    );
    expect(() => storeFromEnv({ ...creds, R2_BUCKET: '  ' }, { dryRun: false, localDir })).toThrow(/R2_BUCKET/);
  });
});

describe('R2Store', () => {
  function fake(responses: Response[]) {
    const requests: Request[] = [];
    const fetchImpl = async (req: Request) => {
      requests.push(req);
      return responses.shift() ?? new Response(null, { status: 500 });
    };
    return { requests, store: new R2Store(creds, fetchImpl) };
  }

  it('signs a PUT to the account’s S3 endpoint', async () => {
    const { requests, store } = fake([new Response(null, { status: 200 })]);
    await store.put('puzzles/a.json', bytes('{}'), 'application/json');
    const req = requests[0]!;
    expect(req.method).toBe('PUT');
    expect(req.url).toBe('https://acc.r2.cloudflarestorage.com/bucket/puzzles/a.json');
    expect(req.headers.get('authorization')).toMatch(/^AWS4-HMAC-SHA256 Credential=key\//);
    expect(req.headers.get('content-type')).toBe('application/json');
  });

  it('lists every page of keys with their ETag (the MD5 for a single PUT)', async () => {
    const page1 = `<ListBucketResult><Contents><Key>puzzles/a.json</Key><ETag>&quot;aaa&quot;</ETag></Contents><IsTruncated>true</IsTruncated><NextContinuationToken>t/2</NextContinuationToken></ListBucketResult>`;
    const page2 = `<ListBucketResult><Contents><Key>puzzles/b&amp;c.json</Key><ETag>"bbb"</ETag></Contents><IsTruncated>false</IsTruncated></ListBucketResult>`;
    const { requests, store } = fake([new Response(page1), new Response(page2)]);
    expect(await store.list('puzzles/')).toEqual(
      new Map([
        ['puzzles/a.json', 'aaa'],
        ['puzzles/b&c.json', 'bbb'],
      ]),
    );
    expect(new URL(requests[1]!.url).searchParams.get('continuation-token')).toBe('t/2');
  });

  it('returns null for a missing key and throws on other errors', async () => {
    const { store } = fake([new Response(null, { status: 404 }), new Response('no', { status: 403 })]);
    expect(await store.get('pipeline/checkpoint.json')).toBeNull();
    await expect(store.get('x')).rejects.toThrow(/403/);
  });
});
