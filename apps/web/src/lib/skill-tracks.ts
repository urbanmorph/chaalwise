import { SKILLS, type SkillId } from '@chaalwise/core/skills';
import { COMES_WITH } from './planned-skills';

/** How strongly a game trains a skill, from 0 (not at all) to 3 (plan, section 1a). */
type Strength = 0 | 1 | 2 | 3;

export interface Track {
  id: SkillId;
  name: string;
  /** Where the skill pays off away from the game, in plain words (plan, section 1d). */
  inLife: string;
  chess: Strength;
  poker: Strength;
  /** Labs and later games that train it too. */
  also: string;
  /** The game it comes with, for a skill chess does not train. */
  comesWith?: string;
}

const t = (id: SkillId, inLife: string, chess: Strength, poker: Strength, also: string): Track => ({
  id,
  name: SKILLS[id],
  inLife,
  chess,
  poker,
  also,
  comesWith: COMES_WITH[id],
});

/** Every skill track for the home page's map: the ones chess trains now first, then the ones that come with poker and the labs. */
export const TRACKS: Track[] = [
  t(
    'think-ahead',
    'See how others will respond before you act: in a negotiation, against a competitor, at the family table.',
    3,
    2,
    'Connect Four, Go, Bagh-Chal',
  ),
  t('calculate', 'Work a plan through step by step before you commit to it.', 3, 1, 'Nim, Pallanguzhi'),
  t('plan-long', 'Know what you are trying to achieve, and make each step serve it.', 3, 1, 'Go'),
  t('size-risk', 'Commit in proportion to your edge, so one bad outcome cannot ruin you.', 1, 3, 'Backgammon'),
  t('composure', 'Decide as well after a setback as before it, and judge decisions, not results.', 1, 3, ''),
  t('weigh-odds', 'Put numbers on uncertainty instead of going on gut feeling.', 0, 3, "Backgammon, Liar's Dice"),
  t('read-hidden', 'Reason from incomplete evidence, and update as more arrives.', 0, 3, "Liar's Dice, Mastermind"),
  t('bluff', 'Understand how others see you, and how that shapes what they do.', 0, 3, "Liar's Dice"),
  t(
    'cooperate',
    'Know when to trust, when to protect yourself, and how reputation builds.',
    0,
    1,
    "Prisoner's Dilemma lab",
  ),
  t('unpredictable', 'Stop being predictable where someone can take advantage of it.', 0, 2, 'Rock-paper-scissors lab'),
  t('value', 'Price things fairly, and avoid overpaying when you win.', 0, 2, 'Auction lab'),
];
