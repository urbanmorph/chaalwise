import type { SkillId } from '@chaalwise/core/skills';

/**
 * The strategy lessons planned in the curriculum (plan, section 6a), so the
 * skills page shows the whole path, not only what is built. A planned lesson
 * whose title matches a built one is shown as a link instead.
 */
export const PLANNED: { title: string; skill: SkillId; stage: number }[] = [
  { title: 'The blunder check', skill: 'think-ahead', stage: 1 },
  { title: 'Their next move', skill: 'think-ahead', stage: 1 },
  { title: 'Count it through', skill: 'calculate', stage: 1 },
  { title: 'Shrink the problem', skill: 'plan-long', stage: 2 },
  { title: 'Patterns save thinking', skill: 'calculate', stage: 2 },
  { title: 'Basics before brilliance', skill: 'plan-long', stage: 3 },
  { title: 'Lead or answer well', skill: 'plan-long', stage: 3 },
  { title: 'When the script runs out', skill: 'plan-long', stage: 3 },
  { title: 'Two birds, one stone', skill: 'think-ahead', stage: 4 },
  { title: 'Find what everything depends on', skill: 'calculate', stage: 4 },
  { title: 'Not so fast', skill: 'think-ahead', stage: 4 },
  { title: 'Fix your weakest link', skill: 'plan-long', stage: 5 },
  { title: 'Simplify when ahead', skill: 'size-risk', stage: 5 },
  { title: 'Give a little, get more', skill: 'size-risk', stage: 5 },
  { title: 'A plan, step by step', skill: 'plan-long', stage: 5 },
  { title: 'Resources change value', skill: 'plan-long', stage: 6 },
  { title: 'Pass the problem back', skill: 'think-ahead', stage: 6 },
  { title: 'Look at three before choosing', skill: 'calculate', stage: 7 },
  { title: 'Spend effort where it matters', skill: 'composure', stage: 7 },
  { title: 'Finish the job', skill: 'plan-long', stage: 7 },
  { title: 'Make it hard', skill: 'composure', stage: 7 },
  { title: 'Review calmly: decisions, not results', skill: 'composure', stage: 7 },
];
