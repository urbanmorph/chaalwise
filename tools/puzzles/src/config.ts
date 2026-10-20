import { sha256 } from './hash.ts';

/** The Lichess puzzle database: about 300 MB of zstd-compressed CSV, CC0, refreshed monthly. */
export const SOURCE_URL = 'https://database.lichess.org/lichess_db_puzzle.csv.zst';

/** A rating band, from `min` (included) to `max` (excluded). */
export interface Band {
  min: number;
  max: number;
}

export interface Config {
  /** Lichess theme names, each becoming its own chunks. */
  themes: string[];
  /** Rating bands, lowest (beginners) first. */
  bands: Band[];
  /** Puzzles kept per theme and band. */
  perBand: number;
  /** Lichess popularity runs from -100 to 100. */
  minPopularity: number;
  minPlays: number;
  /** A smaller deviation means Lichess is surer of the rating. */
  maxRatingDeviation: number;
}

export const DEFAULT_CONFIG: Config = {
  themes: ['mateIn1', 'backRankMate', 'hangingPiece', 'fork', 'pin', 'skewer', 'discoveredAttack'],
  bands: [
    { min: 400, max: 800 },
    { min: 800, max: 1000 },
    { min: 1000, max: 1200 },
    { min: 1200, max: 1400 },
    { min: 1400, max: 1600 },
  ],
  perBand: 80,
  minPopularity: 80,
  minPlays: 500,
  maxRatingDeviation: 90,
};

/** Bump when the way rows are chosen or written changes, so finished runs are redone. */
const PIPELINE_VERSION = 1;

/** Identifies the settings a checkpoint was made with: a change means the work is redone. */
export function configHash(config: Config): string {
  return sha256(new TextEncoder().encode(JSON.stringify({ PIPELINE_VERSION, config }))).slice(0, 16);
}
