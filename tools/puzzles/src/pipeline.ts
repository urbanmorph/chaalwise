import { existsSync, readFileSync, rmSync, writeSync } from 'node:fs';
import { join } from 'node:path';
import { buildOutputs, PREFIX } from './chunks.ts';
import { chunkKey, chunkKeysFor, parseHeader, parseRow, type Header, type Puzzle } from './csv.ts';
import { configHash, DEFAULT_CONFIG, type Config } from './config.ts';
import { md5 } from './hash.ts';
import { headSource, sourceLines, type SourceIdentity } from './source.ts';
import { writeAtomic, type Store } from './store.ts';
import { verifyPuzzle } from './verify.ts';

export const CHECKPOINT_KEY = 'pipeline/checkpoint.json';

export interface RunOptions {
  url: string;
  /** Local working directory: the downloaded bytes, the checkpoint and the outputs (under `out/`). */
  cacheDir: string;
  /** Durable copy of the checkpoint and the outputs. */
  store: Store;
  config?: Config;
  /** Milliseconds; read once at the start and once per row read, so tests can step it. */
  clock?: () => number;
  /** Stop cleanly, keeping progress, after this long. */
  timeLimitMs: number;
  /** Save the checkpoint locally and durably this often. */
  checkpointEveryMs: number;
  /** Abort to stop cleanly (a signal or a hard time limit); progress is kept. */
  signal?: AbortSignal;
  log?: (line: string) => void;
  progressEveryRows?: number;
}

export interface RunResult {
  status: 'done' | 'time-limit' | 'stopped';
  /** True when a finished checkpoint for the same source and settings meant no rows were read. */
  skipped: boolean;
  rowsDone: number;
  kept: Record<string, number>;
  invalid: number;
}

/** Everything needed to carry on, and nothing that differs between two runs doing the same work. */
interface Checkpoint {
  configHash: string;
  source: SourceIdentity;
  rowsDone: number;
  done: boolean;
  /** Rows that passed the filters but failed the chessops check. */
  invalid: number;
  kept: Record<string, Puzzle[]>;
}

const encode = (value: unknown) => new TextEncoder().encode(JSON.stringify(value));
const decode = (body: Uint8Array | null) => (body ? (JSON.parse(new TextDecoder().decode(body)) as Checkpoint) : null);
const sameBytes = (path: string, body: Uint8Array) => existsSync(path) && Buffer.from(body).equals(readFileSync(path));
const stdout = (line: string) => writeSync(1, `${line}\n`); // synchronous: unbuffered, even through a pipe

export async function run(o: RunOptions): Promise<RunResult> {
  const config = o.config ?? DEFAULT_CONFIG;
  const clock = o.clock ?? Date.now;
  const log = o.log ?? stdout;
  const start = clock();
  const keys = config.themes.flatMap((t) => config.bands.map((b) => chunkKey(t, b)));
  const localCheckpoint = join(o.cacheDir, 'checkpoint.json');

  const id = await headSource(o.url, o.signal);
  const hash = configHash(config);
  // One listing up front: every later upload is skipped when this MD5 already matches.
  const durable = new Map([...(await o.store.list(PREFIX)), ...(await o.store.list('pipeline/'))]);

  // Resume from the furthest checkpoint, local or durable, made from this file with these settings.
  const found = [
    decode(existsSync(localCheckpoint) ? readFileSync(localCheckpoint) : null),
    decode(await o.store.get(CHECKPOINT_KEY)),
  ];
  const usable = found.filter(
    (c): c is Checkpoint => c?.configHash === hash && c.source.etag === id.etag && c.source.size === id.size,
  );
  let state = usable.sort((a, b) => b.rowsDone - a.rowsDone)[0];
  if (state)
    log(
      state.done
        ? 'Finished checkpoint found for this file and settings: nothing to read.'
        : `Resuming at row ${state.rowsDone}.`,
    );
  else {
    log(`Starting fresh: ${found.some(Boolean) ? 'the source file or settings changed' : 'no checkpoint'}.`);
    state = { configHash: hash, source: id, rowsDone: 0, done: false, invalid: 0, kept: {} };
  }
  for (const k of keys) state.kept[k] ??= [];
  const st = state;

  async function put(key: string, body: Uint8Array, localPath: string) {
    if (!sameBytes(localPath, body)) writeAtomic(localPath, body);
    const sum = md5(body);
    if (durable.get(key) === sum) return false;
    await o.store.put(key, body);
    durable.set(key, sum);
    return true;
  }
  const save = async () => {
    await put(CHECKPOINT_KEY, encode(st), localCheckpoint);
    log(`Checkpoint saved at row ${st.rowsDone} (local and ${o.store.name}).`);
  };

  let bytes = 0;
  const progress = (now: number) => {
    const perTheme = config.themes.map(
      (t) => `${t} ${config.bands.reduce((n, b) => n + st.kept[chunkKey(t, b)]!.length, 0)}`,
    );
    const mb = (bytes / 1e6).toFixed(1);
    log(
      `rows ${st.rowsDone} · kept ${perTheme.join(' · ')} · invalid ${st.invalid} · ${mb} MB read · elapsed ${Math.round((now - start) / 1000)}s`,
    );
  };

  const skipped = st.done;
  let status: RunResult['status'] = 'done';
  if (!st.done) {
    const sourceFile = join(o.cacheDir, 'source.zst');
    const sourceId = join(o.cacheDir, 'source.json');
    // Downloaded bytes are reused only if they come from this same edition of the file.
    if (!sameBytes(sourceId, encode(id))) {
      rmSync(sourceFile, { force: true });
      writeAtomic(sourceId, encode(id));
    }
    const full = (k: string) => st.kept[k]!.length >= config.perBand;
    const every = o.progressEveryRows ?? 250_000;
    let header: Header | undefined;
    let row = 0;
    let lastSave = start;
    let now = start;
    try {
      for await (const line of sourceLines(id, sourceFile, { signal: o.signal, onBytes: (n) => (bytes += n) })) {
        if (!header) {
          header = parseHeader(line);
          continue;
        }
        if (!line || ++row <= st.rowsDone) continue;
        const parsed = parseRow(line, header);
        const wanted = parsed ? chunkKeysFor(parsed, config).filter((k) => !full(k)) : [];
        if (parsed && wanted.length) {
          if (verifyPuzzle(parsed)) {
            const { id: pid, fen, moves, rating, themes } = parsed;
            for (const k of wanted) st.kept[k]!.push({ id: pid, fen, moves, rating, themes });
          } else st.invalid++;
        }
        st.rowsDone = row;
        if (keys.every(full)) break;
        now = clock();
        if (row % every === 0) progress(now);
        if (now - lastSave >= o.checkpointEveryMs) {
          await save();
          lastSave = now;
        }
        if (o.signal?.aborted) {
          status = 'stopped';
          break;
        }
        if (now - start >= o.timeLimitMs) {
          status = 'time-limit';
          break;
        }
      }
      if (status === 'done') st.done = true;
    } catch (e) {
      if (!o.signal?.aborted) throw e;
      status = 'stopped';
    } finally {
      progress(now);
      // Saved on every exit, failures included; a save that fails here must not hide the first error.
      await save().catch((e) => log(`Could not save the checkpoint on exit: ${e}`));
    }
  }

  if (st.done) {
    const { chunks, manifest } = buildOutputs(st.kept, config);
    let uploaded = 0;
    // The manifest last, so it never lists a chunk that is not there yet.
    for (const f of [...chunks, manifest]) if (await put(f.key, f.body, join(o.cacheDir, 'out', f.key))) uploaded++;
    log(
      `Done: ${chunks.length} chunks; ${uploaded} uploaded to ${o.store.name}, ${chunks.length + 1 - uploaded} unchanged.`,
    );
  } else {
    log(`Stopped (${status}) at row ${st.rowsDone}; progress kept. Run again to continue.`);
  }

  const kept = Object.fromEntries(keys.map((k) => [k, st.kept[k]!.length]));
  return { status, skipped, rowsDone: st.rowsDone, kept, invalid: st.invalid };
}
