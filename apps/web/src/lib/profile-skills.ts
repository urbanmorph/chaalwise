import { SKILL_IDS, type SkillId } from '@chaalwise/core/skills';
import { LABS } from './labs/labs';
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

/** Poker proficiency: what a poker lesson answer shows. */
export const POKER_SKILLS: ChessSkill[] = [
  {
    id: 'hand-reading',
    name: 'Reading hands',
    means: 'Know what beats what, and see the best hand the shared cards allow.',
    practise: { href: '/poker/hand-rankings/', label: 'What beats what' },
  },
  {
    id: 'starting-hands',
    track: 'size-risk',
    name: 'Choosing hands',
    means: 'Fold most starting hands, and play the few worth the points.',
    practise: { href: '/poker/starting-hands/', label: 'Which hands to play' },
  },
  {
    id: 'position',
    track: 'read-hidden',
    name: 'Position',
    means: 'Use what the others do before you act.',
    practise: { href: '/poker/position/', label: 'Acting last' },
  },
  {
    id: 'odds',
    track: 'weigh-odds',
    name: 'Odds',
    means: 'Count your outs and weigh the chance against the price of a call.',
    practise: { href: '/poker/outs-and-odds/', label: 'Outs and odds' },
  },
  {
    id: 'betting',
    track: 'bluff',
    name: 'Betting with a reason',
    means: 'Bet to be called by worse hands, or to make better ones fold.',
    practise: { href: '/poker/why-you-bet/', label: 'Why you bet' },
  },
  {
    id: 'ranges',
    track: 'read-hidden',
    name: 'Ranges',
    means: 'Think of every hand the other player could hold, and how often you win against them.',
    practise: { href: '/poker/ranges-and-equity/', label: 'What they could hold' },
  },
  {
    id: 'signals',
    track: 'bluff',
    name: 'Signals and tests',
    means: 'Believe what is costly to fake, and bet to learn what others hold.',
    practise: { href: '/poker/signals-and-tests/', label: 'Signals and tests' },
  },
  {
    id: 'tilt',
    track: 'composure',
    name: 'Keeping your head',
    means: 'Decide the next hand as well as the last, whatever you just lost.',
    practise: { href: '/poker/tilt/', label: 'After a bad loss' },
  },
];

/** Every game's skills, chess and poker: the evidence a track gets from play, kept apart from answers off the board. */
export const GAME_SKILLS: ChessSkill[] = [...CHESS_SKILLS, ...POKER_SKILLS];

export const isGameSkill = (id: string) => GAME_SKILLS.some((s) => s.id === id);

/** The strategy track an answer counts towards: a track's own id, or the track its chess skill trains. */
export const trackOf = (measures: string | undefined): SkillId | undefined =>
  (SKILL_IDS as string[]).includes(measures ?? '')
    ? (measures as SkillId)
    : GAME_SKILLS.find((s) => s.id === measures)?.track;

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

/**
 * The tracks the built strategy lessons train. Kept here, not read from the
 * content, because the profile runs in the browser; a test keeps it in step.
 */
export const LESSON_TRACKS: SkillId[] = ['think-ahead', 'calculate', 'plan-long', 'size-risk', 'composure'];

/** The strategy tracks, in the home page's order. A track is measured once a chess skill, a lab or a strategy lesson gives evidence for it. */
export const PROFILE_SKILLS: ProfileSkill[] = TRACKS.map((track) => {
  const measured =
    GAME_SKILLS.some((s) => s.track === track.id) ||
    LABS.some((l) => l.track === track.id) ||
    LESSON_TRACKS.includes(track.id);
  return {
    id: track.id,
    name: track.name,
    short: SHORT[track.id],
    means: track.inLife,
    practise: { href: `/skills/${track.id}/`, label: `${track.name} course` },
    later: measured ? undefined : 'Comes with later lessons.',
  };
});

/** Drills and practice kinds give evidence too. */
export const DRILL_SKILL: Record<string, string> = {
  coordinates: 'board',
  'piece-squares': 'board',
  safety: 'safety',
  'loose-pieces': 'safety',
  mate: 'endgame',
  'poker-outs': 'odds',
  'poker-pot-odds': 'odds',
  'poker-equity': 'odds',
  // Reading the board for the nuts is seeing every hand the others could hold.
  'poker-nuts': 'ranges',
  'poker-preflop': 'starting-hands',
};

/**
 * The track a reference question counts towards: off-board ideas (strategy and
 * the labs) whose track the profile measures. Chess entries count nowhere: chess
 * answers belong to the lessons' own game skills.
 */
export const referenceMeasures = (game: string, skill: string | undefined): SkillId | undefined =>
  (game === 'strategy' || game === 'labs') && !PROFILE_SKILLS.find((s) => s.id === skill)?.later
    ? (skill as SkillId | undefined)
    : undefined;
