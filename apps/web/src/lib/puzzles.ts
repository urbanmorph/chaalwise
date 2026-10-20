import { playUci, setup, turnOf } from './chess';

/**
 * Puzzles from the Lichess puzzle database (CC0), chosen and checked by the
 * pipeline in tools/puzzles and shipped with the site. A puzzle's first move is
 * the opponent's; the learner plays every other move after it.
 */
export interface Puzzle {
  id: string;
  fen: string;
  moves: string[];
  rating: number;
  themes: string[];
}

export interface PuzzleState {
  puzzle: Puzzle;
  fen: string;
  /** Index of the next move in `puzzle.moves`: always one of the learner's. */
  next: number;
  lastMove: string;
  side: 'white' | 'black';
}

export interface Band {
  min: number;
  max: number;
  name: string;
}

const BANDS: Band[] = [
  { min: 400, max: 800, name: 'First steps' },
  { min: 800, max: 1000, name: 'Easy' },
  { min: 1000, max: 1200, name: 'Getting harder' },
  { min: 1200, max: 1400, name: 'Harder' },
  { min: 1400, max: 1600, name: 'Hard' },
];

/** The themes the drill offers, each with the reference entry that explains it and the chess skill its answers count towards. */
export const THEMES = [
  { id: 'mateIn1', title: 'Mate in one', entry: 'chess/check', skill: 'patterns' },
  { id: 'backRankMate', title: 'Back-rank mate', entry: 'chess/back-rank-mate', skill: 'patterns' },
  { id: 'hangingPiece', title: 'Take the hanging piece', entry: 'chess/hanging-piece', skill: 'safety' },
  { id: 'fork', title: 'Fork', entry: 'chess/fork', skill: 'patterns' },
  { id: 'pin', title: 'Pin', entry: 'chess/pin', skill: 'patterns' },
  { id: 'skewer', title: 'Skewer', entry: 'chess/skewer', skill: 'patterns' },
  { id: 'discoveredAttack', title: 'Discovered attack', entry: 'chess/discovered-attack', skill: 'patterns' },
].map((theme) => ({ ...theme, bands: BANDS }));

export type Theme = (typeof THEMES)[number];

/** The puzzle as the learner first sees it: after the opponent's move. */
export function begin(puzzle: Puzzle): PuzzleState {
  const first = puzzle.moves[0]!;
  const fen = playUci(puzzle.fen, first);
  return { puzzle, fen, next: 1, lastMove: first, side: turnOf(fen) };
}

const mates = (fen: string, uci: string): boolean => {
  try {
    return setup(playUci(fen, uci))?.isCheckmate() ?? false;
  } catch {
    return false;
  }
};

/**
 * The learner's move: right (and the opponent replies), solved, or wrong (the
 * position stays as it was). On the last move any mate counts, as on Lichess.
 */
export function move(state: PuzzleState, uci: string): { result: 'right' | 'solved' | 'wrong'; state: PuzzleState } {
  const { puzzle, fen, next } = state;
  const expected = puzzle.moves[next]!;
  const last = next === puzzle.moves.length - 1;
  if (uci !== expected && !(last && mates(fen, uci))) return { result: 'wrong', state };
  const played = playUci(fen, uci);
  if (last) return { result: 'solved', state: { ...state, fen: played, next: next + 1, lastMove: uci } };
  const reply = puzzle.moves[next + 1]!;
  return { result: 'right', state: { ...state, fen: playUci(played, reply), next: next + 2, lastMove: reply } };
}

const chunks = import.meta.glob<{ puzzles: Puzzle[] }>('../data/puzzles/*-*.json', { import: 'default' });

/** One theme's puzzles at one level, loaded only when asked for. */
export async function puzzlesFor(theme: string, band: Band): Promise<Puzzle[]> {
  const load = chunks[`../data/puzzles/${theme}-${band.min}-${band.max}.json`];
  if (!load) throw new Error(`No puzzles for ${theme} at ${band.min}`);
  return (await load()).puzzles;
}
