import { describe, expect, it } from 'vitest';
import { buildOutputs } from '../src/chunks.ts';
import type { Config } from '../src/config.ts';
import { sha256 } from '../src/hash.ts';

const config: Config = {
  themes: ['fork', 'pin'],
  bands: [
    { min: 400, max: 1000 },
    { min: 1000, max: 1600 },
  ],
  perBand: 2,
  minPopularity: 80,
  minPlays: 500,
  maxRatingDeviation: 90,
};

const puzzle = (id: string, rating: number) => ({
  id,
  fen: '8/8/8/8/8/8/8/K6k w - - 0 1',
  moves: ['a1a2', 'h1h2'],
  rating,
  themes: ['fork'],
});

describe('buildOutputs', () => {
  const kept = { 'fork-400-1000': [puzzle('a', 900), puzzle('b', 800)], 'pin-1000-1600': [puzzle('c', 1200)] };
  const { chunks, manifest } = buildOutputs(kept, config);

  it('writes one chunk per non-empty theme and band, named with a hash of its content', () => {
    expect(chunks.map((c) => c.key)).toEqual([
      expect.stringMatching(/^puzzles\/fork-400-1000\.[0-9a-f]{12}\.json$/),
      expect.stringMatching(/^puzzles\/pin-1000-1600\.[0-9a-f]{12}\.json$/),
    ]);
    for (const c of chunks) expect(c.key).toContain(sha256(c.body).slice(0, 12));
    const fork = JSON.parse(new TextDecoder().decode(chunks[0]!.body));
    expect(fork).toMatchObject({ theme: 'fork', min: 400, max: 1000, licence: 'CC0' });
    expect(fork.puzzles.map((p: { id: string }) => p.id)).toEqual(['a', 'b']);
  });

  it('lists the chunks in a manifest, in config order', () => {
    expect(manifest.key).toBe('puzzles/manifest.json');
    const m = JSON.parse(new TextDecoder().decode(manifest.body));
    expect(m.chunks).toEqual([
      { theme: 'fork', min: 400, max: 1000, count: 2, file: chunks[0]!.key.slice('puzzles/'.length) },
      { theme: 'pin', min: 1000, max: 1600, count: 1, file: chunks[1]!.key.slice('puzzles/'.length) },
    ]);
  });

  it('gives the same bytes for the same puzzles', () => {
    const again = buildOutputs(structuredClone(kept), config);
    expect(again.chunks.map((c) => c.key)).toEqual(chunks.map((c) => c.key));
    expect(again.manifest.body).toEqual(manifest.body);
  });
});
