import { SKILLS, type SkillId } from '@chaalwise/core/skills';

/** How much a game exercises a skill, from 0 (not at all) to 3: a design judgement (plan, section 1a), not a measured effect. */
type Strength = 0 | 1 | 2 | 3;

export interface Track {
  id: SkillId;
  name: string;
  /** Where the skill pays off away from the game, in plain words (plan, section 1d). */
  inLife: string;
  chess: Strength;
  poker: Strength;
}

const t = (id: SkillId, inLife: string, chess: Strength, poker: Strength): Track => ({
  id,
  name: SKILLS[id],
  inLife,
  chess,
  poker,
});

/** Every skill track for the home page's map: the ones chess trains now first, then the ones that come with poker and the labs. */
export const TRACKS: Track[] = [
  t(
    'think-ahead',
    'See how others will respond before you act: in a negotiation, against a competitor, at the family table.',
    3,
    2,
  ),
  t('calculate', 'Work a plan through step by step before you commit to it.', 3, 1),
  t('plan-long', 'Know what you are trying to achieve, and make each step serve it.', 3, 1),
  t('size-risk', 'Commit in proportion to how far the odds favour you, so one bad outcome cannot ruin you.', 1, 3),
  t('composure', 'Decide as well after a setback as before it, and judge decisions, not results.', 1, 3),
  t('weigh-odds', 'Put numbers on uncertainty instead of going on gut feeling.', 0, 3),
  t('read-hidden', 'Reason from incomplete evidence, and update as more arrives.', 0, 3),
  t('bluff', 'Understand how others see you, and how that shapes what they do.', 0, 3),
  t('cooperate', 'Know when to trust, when to protect yourself, and how reputation builds.', 0, 1),
  t('unpredictable', 'Stop being predictable where someone can take advantage of it.', 0, 2),
  t('value', 'Price things fairly, and avoid overpaying when you win.', 0, 2),
];

/**
 * The labs and later games that train each track too. Kept apart from TRACKS, which the browser loads with the
 * skill profile, so naming a new lab here adds nothing to any page's JavaScript.
 */
export const TRACK_ALSO: Record<SkillId, string> = {
  'think-ahead': 'The bonus rule, Who moves first and Guess two-thirds labs, Connect Four, Go, Bagh-Chal',
  calculate: 'Nim lab, Pallanguzhi',
  'plan-long': 'Go',
  'size-risk': 'Who backs down? lab, Backgammon',
  composure: 'Gain or loss? lab',
  'weigh-odds': "Which bag? lab, Backgammon, Liar's Dice",
  'read-hidden':
    "Rule finder, Ask the panel, First number wins?, Used scooters and Follow the queue? labs, Liar's Dice, Mastermind",
  bluff: "Liar's Dice",
  cooperate: "Prisoner's Dilemma, Pick the same, Split it fairly? and The shared fund labs",
  unpredictable: 'Rock-paper-scissors lab',
  value: 'Sealed-bid auction, Split the pie and Trade what matters less labs',
};

/** The game that trains a skill best, for the home page: chess or poker where it is strongest, otherwise the game-theory labs. */
export const bestIn = (t: Track): 'chess' | 'poker' | 'labs' =>
  t.chess === 3 ? 'chess' : t.poker === 3 ? 'poker' : 'labs';
