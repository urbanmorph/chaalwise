import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, type Config } from '../src/config.ts';
import { chunkKeysFor, parseHeader, parseRow } from '../src/csv.ts';

const lines = readFileSync(new URL('./fixtures/puzzles.csv', import.meta.url), 'utf8')
  .trimEnd()
  .split('\n');
const header = parseHeader(lines[0]!);

const config: Config = {
  themes: ['mateIn1', 'fork', 'pin'],
  bands: [
    { min: 400, max: 1000 },
    { min: 1000, max: 1600 },
  ],
  perBand: 2,
  minPopularity: 80,
  minPlays: 500,
  maxRatingDeviation: 90,
};

describe('parseHeader', () => {
  it('maps the Lichess column names, whatever their order', () => {
    expect(header).toMatchObject({ PuzzleId: 0, FEN: 1, Moves: 2, Rating: 3, Themes: 7 });
    const moved = parseHeader('Themes,Moves,FEN,PuzzleId,Rating,RatingDeviation,Popularity,NbPlays');
    expect(moved.PuzzleId).toBe(3);
  });

  it('refuses a header without the columns it needs', () => {
    expect(() => parseHeader('PuzzleId,FEN')).toThrow(/Moves/);
  });
});

describe('parseRow', () => {
  it('reads a Lichess row into a puzzle', () => {
    const row = parseRow(
      lines.find((l) => l.startsWith('0000H,'))!,
      header,
    );
    expect(row).toEqual({
      id: '0000H',
      fen: 'r4rk1/pp3ppp/8/2bqp2b/3N4/P2Bn2P/1PPN1P2/R1BQ1RK1 w - - 1 15',
      moves: ['d1h5', 'd5g2'],
      rating: 1554,
      ratingDeviation: 223,
      popularity: 100,
      plays: 11,
      themes: ['mate', 'mateIn1', 'middlegame', 'oneMove'],
    });
  });

  it('returns null for blank or broken rows', () => {
    expect(parseRow('', header)).toBeNull();
    expect(parseRow('abc,def', header)).toBeNull();
    expect(parseRow('x,fen,e2e4 e7e5,notanumber,1,1,1,fork', header)).toBeNull();
  });
});

describe('chunkKeysFor', () => {
  const row = (line: string) => parseRow(line, header)!;
  const find = (id: string) => row(lines.find((l) => l.startsWith(`${id},`))!);

  it('puts a puzzle in each wanted theme, in the band of its rating', () => {
    // 003Tx: fork and backRankMate, rated 1511; only fork is wanted here.
    expect(chunkKeysFor(find('003Tx'), config)).toEqual(['fork-1000-1600']);
    expect(chunkKeysFor(find('000rZ'), config)).toEqual(['mateIn1-400-1000']);
  });

  it('drops puzzles that are unpopular, little played, unsure or out of range', () => {
    expect(chunkKeysFor(find('0000H'), config)).toEqual([]); // 11 plays, deviation 223
    expect(chunkKeysFor(find('001KR'), config)).toEqual([]); // 185 plays
    expect(chunkKeysFor({ ...find('000rZ'), popularity: 50 }, config)).toEqual([]);
    expect(chunkKeysFor({ ...find('000rZ'), rating: 1600 }, config)).toEqual([]); // bands are [min, max)
    expect(chunkKeysFor({ ...find('000rZ'), rating: 399 }, config)).toEqual([]);
  });

  it('defaults to the beginner themes and bands, lowest first', () => {
    expect(DEFAULT_CONFIG.themes).toEqual(
      expect.arrayContaining(['mateIn1', 'fork', 'pin', 'skewer', 'backRankMate', 'discoveredAttack', 'hangingPiece']),
    );
    const mins = DEFAULT_CONFIG.bands.map((b) => b.min);
    expect(mins).toEqual([...mins].sort((a, b) => a - b));
  });
});
