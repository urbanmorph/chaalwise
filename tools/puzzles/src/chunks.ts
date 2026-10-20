import type { Config } from './config.ts';
import { chunkKey, type Puzzle } from './csv.ts';
import { sha256 } from './hash.ts';

export const PREFIX = 'puzzles/';
const SOURCE = 'Lichess puzzle database, database.lichess.org';

export interface OutputFile {
  /** Store key, also the path under the local output directory. */
  key: string;
  body: Uint8Array;
}

const encode = (value: unknown) => new TextEncoder().encode(JSON.stringify(value));

/**
 * Turns the kept puzzles into one JSON file per non-empty theme and band, named with a hash of
 * its content (`puzzles/fork-800-1000.<hash>.json`, cacheable for ever), plus a manifest listing
 * them. The same puzzles always give the same bytes.
 */
export function buildOutputs(kept: Record<string, Puzzle[]>, config: Config) {
  const chunks: OutputFile[] = [];
  const listed = [];
  for (const theme of config.themes) {
    for (const { min, max } of config.bands) {
      const puzzles = kept[chunkKey(theme, { min, max })] ?? [];
      if (!puzzles.length) continue;
      const body = encode({
        theme,
        min,
        max,
        source: SOURCE,
        licence: 'CC0',
        puzzles: puzzles.map(({ id, fen, moves, rating, themes }) => ({ id, fen, moves, rating, themes })),
      });
      const file = `${chunkKey(theme, { min, max })}.${sha256(body).slice(0, 12)}.json`;
      chunks.push({ key: PREFIX + file, body });
      listed.push({ theme, min, max, count: puzzles.length, file });
    }
  }
  const manifest: OutputFile = {
    key: `${PREFIX}manifest.json`,
    body: encode({ source: SOURCE, licence: 'CC0', chunks: listed }),
  };
  return { chunks, manifest };
}
