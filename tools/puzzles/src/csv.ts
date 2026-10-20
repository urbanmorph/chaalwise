import type { Band, Config } from './config.ts';

/** A puzzle as the app uses it. `moves` are UCI; the first is the opponent's, the rest the solution. */
export interface Puzzle {
  id: string;
  fen: string;
  moves: string[];
  rating: number;
  themes: string[];
}

export interface Row extends Puzzle {
  ratingDeviation: number;
  popularity: number;
  plays: number;
}

const COLUMNS = ['PuzzleId', 'FEN', 'Moves', 'Rating', 'RatingDeviation', 'Popularity', 'NbPlays', 'Themes'] as const;
export type Header = Record<(typeof COLUMNS)[number], number>;

/** Maps each needed column to its index, so a reordered or extended header still reads. */
export function parseHeader(line: string): Header {
  const names = line.trim().split(',');
  const missing = COLUMNS.filter((c) => !names.includes(c));
  if (missing.length) throw new Error(`Puzzle CSV header lacks ${missing.join(', ')}: ${line.slice(0, 200)}`);
  return Object.fromEntries(COLUMNS.map((c) => [c, names.indexOf(c)])) as Header;
}

/** Reads one CSV line. Lichess puzzle fields never contain commas or quotes, so a split is exact. */
export function parseRow(line: string, h: Header): Row | null {
  const f = line.split(',');
  const id = f[h.PuzzleId];
  const fen = f[h.FEN];
  const moves = f[h.Moves];
  const themes = f[h.Themes];
  const numbers = [h.Rating, h.RatingDeviation, h.Popularity, h.NbPlays].map((i) => Number(f[i]));
  if (!id || !fen || !moves || themes === undefined || numbers.some((n) => !Number.isFinite(n))) return null;
  const [rating, ratingDeviation, popularity, plays] = numbers as [number, number, number, number];
  return { id, fen, moves: moves.split(' '), rating, ratingDeviation, popularity, plays, themes: themes.split(' ') };
}

export const chunkKey = (theme: string, band: Band) => `${theme}-${band.min}-${band.max}`;

/** The chunks a row belongs in: one per wanted theme it has, in the band of its rating, if it passes the filters. */
export function chunkKeysFor(row: Row, config: Config): string[] {
  if (
    row.popularity < config.minPopularity ||
    row.plays < config.minPlays ||
    row.ratingDeviation > config.maxRatingDeviation
  )
    return [];
  const band = config.bands.find((b) => row.rating >= b.min && row.rating < b.max);
  if (!band) return [];
  return config.themes.filter((t) => row.themes.includes(t)).map((t) => chunkKey(t, band));
}
