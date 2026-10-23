/**
 * Where to practise more on Lichess, free and with no ads: each chess lesson and
 * drill points to the Lichess page that trains the same thing. Every address was
 * checked when added. Lichess is credited by name and never presented as ours.
 */
export interface LichessLink {
  href: string;
  label: string;
}

const L = 'https://lichess.org';
const puzzles = (theme: string, name: string): LichessLink => ({
  href: `${L}/training/${theme}`,
  label: `${name} puzzles from real games`,
});
const COORDINATES = { href: `${L}/training/coordinate`, label: 'the coordinates trainer, against the clock' };
const LEARN = { href: `${L}/learn`, label: 'learn each piece step by step' };
const MATES = { href: `${L}/practice`, label: 'the basic checkmates, against the computer' };

/** By lesson id. Only the lesson that sends you off to play a full game has no entry. */
export const LICHESS_LESSONS: Record<string, LichessLink> = {
  'chess/board': COORDINATES,
  'chess/coordinates': COORDINATES,
  'chess/notation': COORDINATES,
  'chess/rook-bishop': LEARN,
  'chess/queen-king': LEARN,
  'chess/knight': LEARN,
  'chess/pawn': LEARN,
  'chess/castling': puzzles('castling', 'Castling'),
  'chess/promotion-en-passant': puzzles('promotion', 'Promotion'),
  'chess/check': puzzles('mateIn1', 'Mate-in-one'),
  'chess/mate-stalemate': puzzles('mateIn1', 'Mate-in-one'),
  'chess/piece-values': LEARN,
  'chess/hanging': puzzles('hangingPiece', 'Hanging piece'),
  'chess/safe-moves': puzzles('hangingPiece', 'Hanging piece'),
  'chess/blunder-check': puzzles('hangingPiece', 'Hanging piece'),
  'chess/back-rank': puzzles('backRankMate', 'Back-rank mate'),
  'chess/queen-mate': MATES,
  'chess/rook-mate': MATES,
  'chess/opening-map': { href: `${L}/opening`, label: 'the opening explorer: every opening, with its main lines' },
  'chess/three-phases': puzzles('opening', 'Opening'),
  'chess/fork': puzzles('fork', 'Fork'),
  'chess/pin': puzzles('pin', 'Pin'),
  'chess/skewer': puzzles('skewer', 'Skewer'),
  'chess/discovered-attack': puzzles('discoveredAttack', 'Discovered attack'),
  'chess/middlegame-intro': puzzles('middlegame', 'Middlegame'),
  'chess/endgame-intro': puzzles('pawnEndgame', 'Pawn endgame'),
};

/** By drill id (lib/drill-list.ts). */
export const LICHESS_DRILLS: Record<string, LichessLink> = {
  'find-the-square': COORDINATES,
  'name-the-square': COORDINATES,
  'where-can-it-go': LEARN,
  'is-this-move-safe': puzzles('hangingPiece', 'Hanging piece'),
  'spot-the-loose-piece': puzzles('hangingPiece', 'Hanging piece'),
  'basic-mates': MATES,
};

/** Every puzzle theme Lichess has, to go on from the themes here. */
export const LICHESS_THEMES: LichessLink = { href: `${L}/training/themes`, label: 'every puzzle theme on Lichess' };
