import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { headSource, sourceLines } from '../src/source.ts';
import { FIXTURE_CSV, multiFrame, serve } from './helpers.ts';

const servers: { close: () => Promise<unknown> }[] = [];
afterEach(async () => {
  await Promise.all(servers.splice(0).map((s) => s.close()));
});

async function readAll(body: Buffer) {
  const server = await serve(body);
  servers.push(server);
  const id = await headSource(server.url);
  const lines: string[] = [];
  for await (const line of sourceLines(id, join(mkdtempSync(join(tmpdir(), 'source-')), 'source.zst')))
    lines.push(line);
  return lines;
}

describe('sourceLines', () => {
  it('reads a file of several zstd frames behind skippable frames, as Lichess publishes it', async () => {
    const lines = await readAll(multiFrame(FIXTURE_CSV));
    expect(lines.join('\n')).toBe(FIXTURE_CSV.toString().trimEnd());
  });

  it('fails loudly on a corrupt file instead of ending quietly', async () => {
    const body = multiFrame(FIXTURE_CSV);
    await expect(readAll(Buffer.concat([body.subarray(0, 100), Buffer.alloc(64, 7)]))).rejects.toThrow(/zstd/);
  });
});
