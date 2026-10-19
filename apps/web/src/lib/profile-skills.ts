/**
 * The chess skills in the profile (plan, section 1e), what each means, and
 * where to practise it. Skills whose evidence needs practice games against the
 * computer say so until that arrives.
 */
export interface ProfileSkill {
  id: string;
  name: string;
  means: string;
  practise: { href: string; label: string };
  /** Evidence that only practice games can give, for skills not yet measured. */
  later?: string;
}

export const PROFILE_SKILLS: ProfileSkill[] = [
  {
    id: 'board',
    name: 'Board sense',
    means: 'Name the squares and see how every piece moves, at a glance.',
    practise: { href: '/chess/drills/', label: 'Coordinates and piece drills' },
  },
  {
    id: 'safety',
    name: 'Safety (the blunder check)',
    means: 'Never leave a piece to be taken, and see what can be taken from you.',
    practise: { href: '/chess/drills/', label: 'Safety drills' },
  },
  {
    id: 'anticipation',
    name: 'Anticipation',
    means: 'See what your opponent wants before they do it.',
    practise: { href: '/chess/blunder-check/', label: 'Checks, captures and threats' },
  },
  {
    id: 'calculation',
    name: 'Calculation',
    means: 'Count a sequence of captures to the end before you start it.',
    practise: { href: '/chess/piece-values/', label: 'Piece values and good trades' },
  },
  {
    id: 'patterns',
    name: 'Applying patterns',
    means: 'Spot the mates and tactics you know when they appear.',
    practise: { href: '/chess/back-rank/', label: 'Back-rank mate' },
  },
  {
    id: 'endgame',
    name: 'Endgame technique',
    means: 'Turn an advantage into a win, starting with the basic mates.',
    practise: { href: '/chess/drills/', label: 'Basic mates against the clock' },
  },
  {
    id: 'opening',
    name: 'Opening choices',
    means: 'Know why the opening moves are played, not just what they are.',
    practise: { href: '/chess/opening-map/', label: 'A map of the openings' },
  },
  {
    id: 'planning',
    name: 'Planning',
    means: 'Choose a plan and make your moves serve it.',
    practise: { href: '/chess/middlegame-intro/', label: 'What the middlegame is about' },
    later: 'Measured fully in practice games, which come next.',
  },
  {
    id: 'time',
    name: 'Time judgement',
    means: 'Spend your thinking time on the moves that matter.',
    practise: { href: '/chess/', label: 'Chess lessons' },
    later: 'Measured in practice games, which come next.',
  },
];

export const PROFILE_SKILL_IDS = PROFILE_SKILLS.map((s) => s.id);
export const isProfileSkill = (id: string) => PROFILE_SKILL_IDS.includes(id);

/** Drills and practice kinds give evidence too. */
export const DRILL_SKILL: Record<string, string> = {
  coordinates: 'board',
  'piece-squares': 'board',
  safety: 'safety',
  'loose-pieces': 'safety',
  mate: 'endgame',
};
