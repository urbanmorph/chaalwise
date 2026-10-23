/**
 * Where to start, by who you are: a few lessons and labs in an order that suits
 * each reader. Strategy lessons and labs only, so no game has to be met first.
 * Ids are lesson ids (`strategy/…`) or labs (`labs/<slug>`).
 */
export interface Start {
  id: string;
  who: string;
  why: string;
  steps: string[];
}

export const STARTS: Start[] = [
  {
    id: 'run-a-team',
    who: 'You run a team or an organisation',
    why: 'Most of your decisions involve another side: a client, a rival, your own people. Start with how they will reply, then trust, then bargaining.',
    steps: [
      'strategy/their-next-move',
      'strategy/blunder-check',
      'labs/prisoners-dilemma',
      'labs/split-the-pie',
      'strategy/review-calmly',
    ],
  },
  {
    id: 'starting-out',
    who: 'You want to get on at work',
    why: 'Others notice who checks before committing, puts effort where it counts and stays steady after a setback.',
    steps: [
      'strategy/not-so-fast',
      'strategy/spend-effort-where-it-matters',
      'strategy/lead-or-answer',
      'labs/rule-finder',
      'strategy/review-calmly',
    ],
  },
  {
    id: 'students',
    who: 'You are a student',
    why: 'Exams, projects and choices about what to study reward counting before you commit, breaking work into steps and testing your own ideas.',
    steps: [
      'strategy/count-it-through',
      'strategy/shrink-the-problem',
      'strategy/a-plan-step-by-step',
      'labs/rule-finder',
      'labs/which-bag',
      'strategy/finish-the-job',
    ],
  },
];
