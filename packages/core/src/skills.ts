/** The skill tracks the site is organised by (plan, section 1a). Game-neutral. */
export const SKILLS = {
  'think-ahead': 'Think ahead',
  calculate: 'Calculate',
  'weigh-odds': 'Weigh odds',
  'size-risk': 'Size the risk',
  'read-hidden': 'Read hidden information',
  'plan-long': 'Plan long-term',
  bluff: 'Bluff and model opponents',
  cooperate: 'Cooperate or defend',
  unpredictable: 'Be unpredictable',
  value: 'Value and bid',
} as const;

export type SkillId = keyof typeof SKILLS;
export const SKILL_IDS = Object.keys(SKILLS) as [SkillId, ...SkillId[]];
