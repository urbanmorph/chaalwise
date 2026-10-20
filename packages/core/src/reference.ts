import { z } from 'zod';
import { questionId } from './lesson';
import { SKILL_IDS } from './skills';

/**
 * The reference: a searchable dictionary at two levels. Strategy entries
 * explain an idea and why it matters away from the game; game entries explain
 * a concept, a move or an opening. Stored as data; each game checks its own
 * positions (chess with chessops at build time).
 */

export const REFERENCE_GAMES = ['strategy', 'chess', 'poker', 'labs'] as const;
export const GAME_NAMES: Record<(typeof REFERENCE_GAMES)[number], string> = {
  strategy: 'Strategy',
  chess: 'Chess',
  poker: 'Poker',
  labs: 'Game theory',
};

export const KIND_NAMES = {
  principle: 'Strategy idea',
  opening: 'Opening',
  tactic: 'Tactic',
  concept: 'Concept',
  endgame: 'Endgame',
  rule: 'Rule',
  odds: 'Odds and maths',
} as const;

export const FAMILY_NAMES = {
  open: 'Open game (1.e4 e5)',
  'semi-open': 'Semi-open game (1.e4, not 1...e5)',
  closed: 'Closed game (1.d4, not 1...Nf6)',
  indian: 'Indian game (1.d4 Nf6)',
  flank: 'Flank opening',
} as const;

const keys = <T extends object>(o: T) => Object.keys(o) as [keyof T & string, ...(keyof T & string)[]];
const square = z.string().regex(/^[a-h][1-8]$/, 'a square such as e4');
const uci = z.string().regex(/^[a-h][1-8][a-h][1-8][qrbn]?$/, 'a move in UCI, such as d5c7');

export const referenceSchema = z
  .object({
    term: z.string().min(1),
    game: z.enum(REFERENCE_GAMES),
    kind: z.enum(keys(KIND_NAMES)),
    level: z.enum(['beginner', 'intermediate', 'advanced']),
    /** Other names people search for, such as "KID" or "Giuoco Piano". */
    aliases: z.array(z.string().min(1)).default([]),
    /** One sentence, shown in search results. */
    summary: z.string().min(1),
    /** Strategy entries: why the idea matters. */
    why: z.string().optional(),
    /** Strategy entries: where it shows up away from the game. */
    inLife: z.string().optional(),
    /** The skill track it belongs to. */
    skill: z.enum(SKILL_IDS).optional(),
    /** Openings: the family from the opening map. */
    family: z.enum(keys(FAMILY_NAMES)).optional(),
    /** Chess: a FEN, `start`, or `moves: e4 e5` for the position after those moves. */
    position: z.string().optional(),
    /** Chess: the key move, drawn as an arrow (and checked as legal). */
    move: uci.optional(),
    /** Chess: squares to ring, such as the pieces a fork attacks. */
    highlight: z.array(square).optional(),
    orientation: z.enum(['white', 'black']).optional(),
    /** Other entries, as ids such as `chess/pin`. */
    related: z.array(z.string().regex(/^[a-z]+\/[a-z0-9-]+$/)).default([]),
    /** The lesson that teaches it, such as `chess/hanging`. */
    lesson: z.string().optional(),
    /** Chess: the matching Lichess puzzle theme or opening page, as its name in https://lichess.org/training/<name>. */
    lichess: z
      .string()
      .regex(/^[A-Za-z_-]+$/, 'the page name only, such as fork or Sicilian_Defense')
      .optional(),
    /** One to three questions to try the idea on the page. */
    try: z.array(questionId).min(1).max(3).optional(),
  })
  .superRefine((entry, ctx) => {
    const need = (field: keyof typeof entry, why: string) => {
      if (entry[field] === undefined) ctx.addIssue({ code: 'custom', path: [field], message: why });
    };
    if (entry.game === 'strategy') {
      need('why', 'a strategy entry says why the idea matters');
      need('inLife', 'a strategy entry says where it shows up away from the game');
      need('skill', 'a strategy entry names the skill it trains');
    }
    if (entry.kind === 'opening') {
      need('family', 'an opening names its family');
      if (!entry.position?.startsWith('moves:'))
        ctx.addIssue({ code: 'custom', path: ['position'], message: 'an opening gives its moves, as `moves: e4 e5`' });
    }
    if (entry.game !== 'chess')
      for (const field of ['position', 'move', 'highlight', 'lichess'] as const)
        if (entry[field] !== undefined)
          ctx.addIssue({ code: 'custom', path: [field], message: 'only chess entries have a board' });
    if (entry.try && new Set(entry.try).size < entry.try.length)
      ctx.addIssue({ code: 'custom', path: ['try'], message: 'each question is asked once' });
  });

export type ReferenceEntry = z.infer<typeof referenceSchema>;
