import { COUNT_KEY } from '../lib/count-key';

/**
 * The site's Worker: the pages are static files, served first by Cloudflare, so
 * this runs only for addresses that are not a file. It keeps the anonymous
 * counts (lib/count.ts): a name and a daily total, in D1, and nothing else.
 */
interface D1 {
  prepare(sql: string): { bind(...args: unknown[]): { run(): Promise<unknown> } };
}
interface Env {
  METRICS: D1;
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (new URL(request.url).pathname !== '/api/count') return env.ASSETS.fetch(request);
    if (request.method !== 'POST') return new Response(null, { status: 405, headers: { allow: 'POST' } });
    const key = (await request.text()).slice(0, 80);
    if (!COUNT_KEY.test(key)) return new Response(null, { status: 400 });
    const day = new Date().toISOString().slice(0, 10);
    await env.METRICS.prepare(
      'INSERT INTO daily (day, key, n) VALUES (?1, ?2, 1) ON CONFLICT (day, key) DO UPDATE SET n = n + 1',
    )
      .bind(day, key)
      .run();
    return new Response(null, { status: 204 });
  },
};
