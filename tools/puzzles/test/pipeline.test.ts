import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { Config } from '../src/config.ts';
import { CHECKPOINT_KEY, run, type RunOptions } from '../src/pipeline.ts';
import { LocalStore, type Store } from '../src/store.ts';
import { FIXTURE_ROWS, mtimes, recording, serve, snapshot, steppingClock } from './helpers.ts';

const config: Config = {
  themes: ['mateIn1', 'fork', 'pin'],
  bands: [
    { min: 400, max: 1000 },
    { min: 1000, max: 1600 },
  ],
  perBand: 5,
  minPopularity: 80,
  minPlays: 500,
  maxRatingDeviation: 90,
};

const servers: { close: () => Promise<unknown> }[] = [];
afterEach(async () => {
  await Promise.all(servers.splice(0).map((s) => s.close()));
});

async function setup(shared?: Awaited<ReturnType<typeof serve>>) {
  const server = shared ?? (await serve());
  if (!shared) servers.push(server);
  const base = mkdtempSync(join(tmpdir(), 'puzzles-'));
  const cacheDir = join(base, 'cache');
  const durableDir = join(base, 'r2');
  const durable = new LocalStore(durableDir);
  const logs: string[] = [];
  const options = (more: Partial<RunOptions> = {}): RunOptions => ({
    url: server.url,
    cacheDir,
    store: durable,
    config,
    clock: steppingClock(),
    timeLimitMs: 1e9,
    checkpointEveryMs: 1e9,
    log: (line) => logs.push(line),
    ...more,
  });
  /** Everything a run leaves behind that matters: outputs, local checkpoint, durable store. */
  const result = () => ({
    out: snapshot(join(cacheDir, 'out')),
    checkpoint: readFileSync(join(cacheDir, 'checkpoint.json'), 'utf8'),
    durable: snapshot(durableDir),
  });
  return { server, base, cacheDir, durableDir, durable, logs, options, result };
}

/**
 * The outcome of one uninterrupted run, to compare interrupted runs with. Pass the server of the
 * run it is compared with: the source URL is part of the checkpoint.
 */
async function reference(server?: Awaited<ReturnType<typeof serve>>) {
  const s = await setup(server);
  const r = await run(s.options());
  return { run: r, files: s.result() };
}

const durableCheckpoint = async (store: Store) =>
  JSON.parse(new TextDecoder().decode((await store.get(CHECKPOINT_KEY))!)) as { rowsDone: number; done: boolean };

describe('run, uninterrupted', () => {
  it('reads every row, keeps verified puzzles per theme and band, and drops the broken ones', async () => {
    const { run: r, files } = await reference();
    expect(r.status).toBe('done');
    expect(r.rowsDone).toBe(FIXTURE_ROWS);
    expect(r.invalid).toBe(2); // BAD01 (illegal moves) and BAD02 (bad FEN)
    expect(r.kept).toEqual({
      'mateIn1-400-1000': 4,
      'mateIn1-1000-1600': 4,
      'fork-400-1000': 4,
      'fork-1000-1600': 4,
      'pin-400-1000': 4,
      'pin-1000-1600': 4,
    });
    const manifest = JSON.parse(files.out['puzzles/manifest.json']!);
    expect(manifest.chunks).toHaveLength(6);
    for (const c of manifest.chunks) expect(files.out[`puzzles/${c.file}`]).toBeDefined();
    // The durable store holds the same outputs plus the checkpoint.
    expect(Object.keys(files.durable).sort()).toEqual([CHECKPOINT_KEY, ...Object.keys(files.out)].sort());
  });

  it('stops reading once every chunk is full', async () => {
    const s = await setup();
    const r = await run(
      s.options({ config: { ...config, themes: ['mateIn1'], bands: [config.bands[0]!], perBand: 1 } }),
    );
    expect(r.status).toBe('done');
    expect(r.rowsDone).toBeLessThan(FIXTURE_ROWS);
    expect(r.kept).toEqual({ 'mateIn1-400-1000': 1 });
  });

  it('logs progress lines: rows read, kept per theme, elapsed', async () => {
    const s = await setup();
    await run(s.options({ progressEveryRows: 10 }));
    const progress = s.logs.filter((l) => /rows \d+/.test(l));
    expect(progress.length).toBeGreaterThanOrEqual(4);
    expect(progress.at(-1)).toMatch(/mateIn1 8 · fork 8 · pin 8 · invalid 2 · .*elapsed/);
  });
});

describe('caching: checkpoints during the run and on exit', () => {
  it('saves a checkpoint locally and durably every interval, and again at the end', async () => {
    const s = await setup();
    const { store, puts } = recording(s.durable);
    // One second per row; checkpoint every 10 seconds.
    await run(s.options({ store, checkpointEveryMs: 10_000 }));
    const saved = puts.filter((p) => p.key === CHECKPOINT_KEY).map((p) => JSON.parse(new TextDecoder().decode(p.body)));
    expect(saved.map((c) => c.rowsDone)).toEqual([10, 20, 30, 40, FIXTURE_ROWS]);
    expect(saved.at(-1).done).toBe(true);
  });

  it('saves on a stop signal and reports it', async () => {
    const s = await setup();
    const controller = new AbortController();
    const clock = steppingClock(1000, (reads) => reads === 8 && controller.abort());
    const r = await run(s.options({ clock, signal: controller.signal }));
    expect(r.status).toBe('stopped');
    const local = JSON.parse(readFileSync(join(s.cacheDir, 'checkpoint.json'), 'utf8'));
    expect(local.rowsDone).toBe(r.rowsDone);
    expect((await durableCheckpoint(s.durable)).rowsDone).toBe(r.rowsDone);
    expect(r.rowsDone).toBeGreaterThan(0);
    expect(r.rowsDone).toBeLessThan(FIXTURE_ROWS);
  });
});

describe('restart', () => {
  it('stops cleanly at its time limit, keeps progress, and resumes to the same result', async () => {
    const s = await setup();
    const ref = await reference(s.server);
    const first = await run(s.options({ timeLimitMs: 15_000 }));
    expect(first.status).toBe('time-limit');
    expect(first.rowsDone).toBe(15);
    expect(existsSync(join(s.cacheDir, 'out'))).toBe(false); // nothing final yet
    expect((await durableCheckpoint(s.durable)).rowsDone).toBe(15);

    const second = await run(s.options());
    expect(second.status).toBe('done');
    expect(s.logs.some((l) => /resuming at row 15\b/i.test(l))).toBe(true);
    expect(s.result()).toEqual(ref.files);
  });

  it('resumes on a fresh machine from the durable checkpoint after a kill with no exit save', async () => {
    const s = await setup();
    const ref = await reference(s.server);
    // Checkpoints every 10 rows; the process "dies" after the second one reaches R2, so the
    // exit save is lost, and the local cache goes with the machine.
    const { store } = recording(s.durable, 2);
    await run(s.options({ store, checkpointEveryMs: 10_000, timeLimitMs: 25_000 }));
    rmSync(s.cacheDir, { recursive: true });
    expect((await durableCheckpoint(s.durable)).rowsDone).toBe(20);

    await run(s.options());
    expect(s.logs.some((l) => /resuming at row 20\b/i.test(l))).toBe(true);
    expect(s.result()).toEqual(ref.files);
  });

  it('after a dropped download, keeps the bytes it has, asks only for the rest, and ends the same', async () => {
    const s = await setup();
    const ref = await reference(s.server);
    s.server.state.cutAfter = 1000;
    await expect(run(s.options())).rejects.toThrow();
    expect(statSync(join(s.cacheDir, 'source.zst')).size).toBe(1000);
    expect(existsSync(join(s.cacheDir, 'checkpoint.json'))).toBe(true); // saved on failure too

    await run(s.options());
    expect(s.server.state.gets.at(-1)).toMatchObject({ range: 'bytes=1000-', 'if-range': '"v1"' });
    expect(s.result()).toEqual(ref.files);
  });

  it('starts again from the top when the source file has changed', async () => {
    const s = await setup();
    await run(s.options({ timeLimitMs: 15_000 }));
    s.server.state.etag = '"v2"';
    const r = await run(s.options());
    expect(s.logs.some((l) => /starting fresh/i.test(l))).toBe(true);
    expect(s.server.state.gets.at(-1)!.range).toBeUndefined();
    expect(r.rowsDone).toBe(FIXTURE_ROWS);
  });
});

describe('idempotency', () => {
  it('a second run with the same inputs downloads nothing, writes nothing and uploads nothing', async () => {
    const s = await setup();
    await run(s.options());
    const before = { local: mtimes(s.cacheDir), durable: mtimes(s.durableDir), gets: s.server.state.gets.length };
    const { store, puts } = recording(s.durable);

    const again = await run(s.options({ store }));
    expect(again.status).toBe('done');
    expect(again.skipped).toBe(true);
    expect(puts).toEqual([]);
    expect(s.server.state.gets.length).toBe(before.gets);
    expect(mtimes(s.cacheDir)).toEqual(before.local);
    expect(mtimes(s.durableDir)).toEqual(before.durable);
  });

  it('re-uploads only what is missing or changed in the durable store', async () => {
    const s = await setup();
    await run(s.options());
    const chunk = Object.keys(snapshot(s.durableDir)).find((k) => k.startsWith('puzzles/fork-'))!;
    rmSync(join(s.durableDir, chunk));
    const { store, puts } = recording(s.durable);
    await run(s.options({ store }));
    expect(puts.map((p) => p.key)).toEqual([chunk]);
  });

  it('does the work again when the settings change', async () => {
    const s = await setup();
    await run(s.options());
    const r = await run(s.options({ config: { ...config, perBand: 1 } }));
    expect(r.skipped).toBe(false);
    expect(r.kept['fork-400-1000']).toBe(1);
  });
});
