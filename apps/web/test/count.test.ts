import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LIVE_HOST } from '../src/lib/analytics';
import { count, COUNT_HOST, COUNT_KEY } from '../src/lib/count';
import worker from '../src/worker/index';

afterEach(() => vi.unstubAllGlobals());

/** A page on a given host, with sendBeacon recorded. */
function onHost(host: string) {
  const sent: [string, unknown][] = [];
  vi.stubGlobal('location', { host });
  vi.stubGlobal('navigator', { sendBeacon: (url: string, body: unknown) => (sent.push([url, body]), true) });
  return sent;
}

describe('counting a finish, anonymously', () => {
  it('counts on the live site only: its own copy of the address, so the page script stays inline', () => {
    expect(COUNT_HOST).toBe(LIVE_HOST);
  });

  it('sends only the name of what was finished, and only from the live site', () => {
    const sent = onHost('chaalwise.com');
    count('played:labs/nim');
    expect(sent).toEqual([['/api/count', 'played:labs/nim']]);
    const local = onHost('localhost:4321');
    count('played:labs/nim');
    expect(local).toEqual([]);
  });

  it('sends nothing that is not a known kind of finish', () => {
    const sent = onHost('chaalwise.com');
    for (const key of [
      'email:me@example.com',
      'played:',
      'finished:Chess/Fork',
      'x'.repeat(200),
      'played:labs/nim?id=1',
    ])
      count(key);
    expect(sent).toEqual([]);
  });

  it('accepts the kinds the pages send', () => {
    for (const key of [
      'finished:chess/fork',
      'finished:cases/quiz-night',
      'played:labs/nim',
      'played:chess/first-moves',
      'hand:practice/steady',
      'drill:puzzles-fork',
      'round:review',
    ])
      expect(key).toMatch(COUNT_KEY);
  });
});

/** A D1 database that records what it is asked to run. */
function fakeD1() {
  const runs: { sql: string; args: unknown[] }[] = [];
  return {
    runs,
    prepare: (sql: string) => ({ bind: (...args: unknown[]) => ({ run: async () => void runs.push({ sql, args }) }) }),
  };
}
const env = () => ({ METRICS: fakeD1(), ASSETS: { fetch: async () => new Response('page') } });

describe('the counter', () => {
  it('adds one to today’s total for the name, and stores nothing else', async () => {
    const e = env();
    const res = await worker.fetch(
      new Request('https://chaalwise.com/api/count', { method: 'POST', body: 'played:labs/nim' }),
      e,
    );
    expect(res.status).toBe(204);
    expect(e.METRICS.runs).toHaveLength(1);
    const { sql, args } = e.METRICS.runs[0]!;
    expect(sql).toMatch(/INSERT INTO daily \(day, key, n\)/);
    expect(args).toEqual([new Date().toISOString().slice(0, 10), 'played:labs/nim']);
  });

  it('refuses anything else, and counts nothing', async () => {
    const e = env();
    const bad = await worker.fetch(
      new Request('https://chaalwise.com/api/count', { method: 'POST', body: 'email:me@example.com' }),
      e,
    );
    const get = await worker.fetch(new Request('https://chaalwise.com/api/count'), e);
    expect([bad.status, get.status]).toEqual([400, 405]);
    expect(e.METRICS.runs).toEqual([]);
  });

  it('leaves every other address to the site itself', async () => {
    const res = await worker.fetch(new Request('https://chaalwise.com/no-such-page/'), env());
    expect(await res.text()).toBe('page');
  });

  it('is deployed with the counter database, and pages still come first', () => {
    const config = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
    expect(config).toContain('"main": "src/worker/index.ts"');
    expect(config).toMatch(/"binding": "METRICS"[\s\S]*"database_name": "chaalwise-metrics"/);
    expect(config).not.toContain('run_worker_first');
  });
});
