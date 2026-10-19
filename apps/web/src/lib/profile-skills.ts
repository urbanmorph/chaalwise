import type { SkillId } from '@chaalwise/core/skills';
import { TRACKS } from './skill-tracks';

/**
 * The skill profile is the strategy tracks (plan, section 1a). Answers are
 * logged as game skills, such as chess safety, and each game skill gives
 * evidence for the track it trains. Board sense trains none: it is learning the
 * game, kept in the profile as chess proficiency.
 */
export interface ProfileSkill {
  id: string;
  name: string;
  /** A one-word name for tight spaces such as the radar's axes. */
  short: string;
  means: string;
  practise: { href: string; label: string };
  /** Where a track not measured yet will come from. */
  later?: string;
}

export interface ChessSkill extends Omit<ProfileSkill, 'short' | 'later'> {
  /** The strategy track its answers give evidence for. */
  track?: SkillId;
}

/** Chess proficiency: what a chess lesson or drill answer shows (plan, section 1e). */
export const CHESS_SKILLS: ChessSkill[] = [
  {
    id: 'board',
    name: 'Board sense',
    means: 'Name the squares and see how every piece moves, at a glance.',
    practise: { href: '/chess/drills/', label: 'Coordinates and piece drills' },
  },
  {
    id: 'safety',
    track: 'think-ahead',
    name: 'Safety (the blunder check)',
    means: 'Never leave a piece to be taken, and see what can be taken from you.',
    practise: { href: '/chess/drills/', label: 'Safety drills' },
  },
  {
    id: 'anticipation',
    track: 'think-ahead',
    name: 'Anticipation',
    means: 'See what your opponent wants before they do it.',
    practise: { href: '/chess/blunder-check/', label: 'Checks, captures and threats' },
  },
  {
    id: 'calculation',
    track: 'calculate',
    name: 'Calculation',
    means: 'Count a sequence of captures to the end before you start it.',
    practise: { href: '/chess/piece-values/', label: 'Piece values and good trades' },
  },
  {
    id: 'patterns',
    track: 'calculate',
    name: 'Applying patterns',
    means: 'Spot the mates and tactics you know when they appear.',
    practise: { href: '/chess/back-rank/', label: 'Back-rank mate' },
  },
  {
    id: 'endgame',
    track: 'plan-long',
    name: 'Endgame technique',
    means: 'Turn an advantage into a win, starting with the basic mates.',
    practise: { href: '/chess/drills/', label: 'Basic mates against the clock' },
  },
  {
    id: 'opening',
    track: 'plan-long',
    name: 'Opening choices',
    means: 'Know why the opening moves are played, not just what they are.',
    practise: { href: '/chess/opening-map/', label: 'A map of the openings' },
  },
  {
    id: 'planning',
    track: 'plan-long',
    name: 'Planning',
    means: 'Choose a plan and make your moves serve it.',
    practise: { href: '/chess/middlegame-intro/', label: 'What the middlegame is about' },
  },
];

const CHESS_SKILL_IDS = CHESS_SKILLS.map((s) => s.id);
export const isChessSkill = (id: string) => CHESS_SKILL_IDS.includes(id);

const SHORT: Record<SkillId, string> = {
  'think-ahead': 'Ahead',
  calculate: 'Calculate',
  'plan-long': 'Plan',
  'size-risk': 'Risk',
  composure: 'Composure',
  'weigh-odds': 'Odds',
  'read-hidden': 'Hidden info',
  bluff: 'Bluff',
  cooperate: 'Cooperate',
  unpredictable: 'Unpredictable',
  value: 'Value',
};

/** The strategy tracks, in the home page's order. A track is measured once some game skill gives evidence for it. */
export const PROFILE_SKILLS: ProfileSkill[] = TRACKS.map((track) => {
  const measured = CHESS_SKILLS.some((s) => s.track === track.id);
  return {
    id: track.id,
    name: track.name,
    short: SHORT[track.id],
    means: track.inLife,
    practise: { href: `/skills/#${track.id}`, label: `${track.name} lessons` },
    later: measured ? undefined : `Comes with ${track.comesWith ?? 'later lessons'}.`,
  };
});

/** Drills and practice kinds give evidence too. */
export const DRILL_SKILL: Record<string, string> = {
  coordinates: 'board',
  'piece-squares': 'board',
  safety: 'safety',
  'loose-pieces': 'safety',
  mate: 'endgame',
};
