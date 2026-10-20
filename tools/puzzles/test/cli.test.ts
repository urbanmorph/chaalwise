import { execFile } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { serve } from './helpers.ts';

const CLI = fileURLToPath(new URL('../src/cli.ts', import.meta.url));
const exec = promisify(execFile);
// The CLI runs on plain Node (type stripping), not through Vitest, so this checks it really starts.
const cli = (args: string[], env: Record<string, string> = {}) =>
  exec(process.execPath, [CLI, ...args], { env: { PATH: process.env.PATH!, ...env } }).then(
    (r) => ({ code: 0, ...r }),
    (e: { code: number; stdout: string; stderr: string }) => e,
  );

let server: Awaited<ReturnType<typeof serve>>;
beforeAll(async () => {
  server = await serve();
});
afterAll(() => server.close());

describe('cli', () => {
  it('runs end to end on plain Node, and a second run does nothing', async () => {
    const args = ['--url', server.url, '--cache-dir', mkdtempSync(join(tmpdir(), 'cli-'))];
    const first = await cli(args);
    expect(first.code).toBe(0);
    expect(first.stdout).toMatch(/no R2_\* variables set: local only/);
    const [, chunks, uploaded] = /Done: (\d+) chunks; (\d+) uploaded/.exec(first.stdout)!;
    expect(Number(uploaded)).toBe(Number(chunks) + 1); // and the manifest
    const second = await cli(args);
    expect(second.stdout).toMatch(/nothing to read[\s\S]*0 uploaded/);
  });

  it('refuses half-set R2 credentials', async () => {
    const r = await cli(['--url', server.url, '--cache-dir', mkdtempSync(join(tmpdir(), 'cli-'))], { R2_BUCKET: 'b' });
    expect(r.code).toBe(1);
    expect(r.stderr).toMatch(/Not uploading: R2_ACCOUNT_ID/);
  });
});
