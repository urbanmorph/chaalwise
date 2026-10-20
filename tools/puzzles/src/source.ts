import { spawn } from 'node:child_process';
import { closeSync, createReadStream, openSync, statSync, writeSync } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

/** What identifies one edition of the source file: a new monthly dump has a new ETag and size. */
export interface SourceIdentity {
  url: string;
  etag: string;
  size: number;
}

export async function headSource(url: string, signal?: AbortSignal): Promise<SourceIdentity> {
  const res = await fetch(url, { method: 'HEAD', signal });
  if (!res.ok) throw new Error(`HEAD ${url}: ${res.status}`);
  const etag = res.headers.get('etag') ?? res.headers.get('last-modified') ?? '';
  const size = Number(res.headers.get('content-length'));
  if (!etag || !Number.isFinite(size) || size <= 0)
    throw new Error(`HEAD ${url}: no ETag or length to check resumes against`);
  return { url, etag, size };
}

/**
 * The compressed bytes, in order: first what an earlier run already saved to `file`, then the
 * rest from the network (a Range request guarded by If-Range), appended to `file` as it arrives.
 * A stopped download therefore never fetches the same bytes twice.
 */
async function* compressedBytes(id: SourceIdentity, file: string, signal?: AbortSignal, onBytes?: (n: number) => void) {
  const have = statSync(file, { throwIfNoEntry: false })?.size ?? 0;
  if (have) {
    for await (const chunk of createReadStream(file, { end: have - 1 })) {
      onBytes?.(chunk.length);
      yield chunk as Buffer;
    }
  }
  if (have >= id.size) return;
  const headers: Record<string, string> = have ? { range: `bytes=${have}-`, 'if-range': id.etag } : {};
  const res = await fetch(id.url, { headers, signal });
  if (res.status !== (have ? 206 : 200) || !res.body) {
    await res.body?.cancel();
    throw new Error(`GET ${id.url} from byte ${have}: ${res.status}; the file may have changed, run again`);
  }
  // Synchronous appends: each chunk is on disk before it is decoded, and nothing is left to flush
  // after the run returns or is killed.
  const fd = openSync(file, 'a');
  try {
    for await (const chunk of res.body) {
      writeSync(fd, chunk);
      onBytes?.(chunk.length);
      yield Buffer.from(chunk);
    }
  } finally {
    closeSync(fd);
  }
}

/**
 * Decompresses with the `zstd` command, streaming. Lichess writes the file with pzstd: many
 * frames, each behind a skippable frame. Node's built-in zstd decoder stops after the first
 * frame; the zstd CLI reads them all, at C speed, and comes with GitHub's Ubuntu runners.
 */
async function* zstd(input: AsyncIterable<Buffer>): AsyncGenerator<Buffer> {
  const child = spawn('zstd', ['-d', '-c', '-q'], { stdio: ['pipe', 'pipe', 'pipe'] });
  let stderr = '';
  child.stderr.on('data', (d) => (stderr += d));
  const exited = new Promise<number | null>((resolve, reject) => {
    child.on('error', (e) =>
      reject(new Error(`Could not run zstd (install it: apt install zstd, brew install zstd): ${e.message}`)),
    );
    child.on('close', resolve);
  });
  exited.catch(() => {}); // awaited below; this only stops an early return leaving it unhandled
  const src = Readable.from(input);
  let feedError: unknown;
  const fed = pipeline(src, child.stdin).catch((e: unknown) => {
    feedError ??= e;
    child.kill();
  });
  try {
    for await (const chunk of child.stdout) yield chunk as Buffer;
    await fed;
    const code = await exited;
    // A network error explains a broken stream better than zstd's complaint about it.
    if (feedError && (feedError as NodeJS.ErrnoException).code !== 'EPIPE') throw feedError;
    if (code !== 0) throw new Error(`zstd could not decompress the source (exit ${code}): ${stderr.trim()}`);
  } finally {
    src.destroy();
    child.kill();
  }
}

/** CSV lines of the source, decompressed as the bytes arrive. */
export async function* sourceLines(
  id: SourceIdentity,
  file: string,
  { signal, onBytes }: { signal?: AbortSignal; onBytes?: (n: number) => void } = {},
): AsyncGenerator<string> {
  const decoder = new TextDecoder();
  let carry = '';
  for await (const chunk of zstd(compressedBytes(id, file, signal, onBytes))) {
    const lines = (carry + decoder.decode(chunk, { stream: true })).split('\n');
    carry = lines.pop()!;
    yield* lines;
  }
  carry += decoder.decode();
  if (carry) yield carry;
}
