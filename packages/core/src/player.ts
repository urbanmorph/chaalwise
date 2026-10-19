import type { Lesson, Step } from './lesson';

/** The player needs only a lesson's steps, so a review session can be played the same way. */
type Playable = Pick<Lesson, 'steps'>;

/**
 * The lesson player as pure state transitions, so the UI only renders state.
 * Retrieval practice: the learner answers first, then sees the explanation.
 */

export type Outcome = 'first-try' | 'with-help' | 'missed';
export type Response =
  | { kind: 'choice'; index: number }
  | { kind: 'move'; move: string }
  | { kind: 'square'; square: string }
  | { kind: 'play'; won: boolean };

export interface PlayerState {
  index: number;
  attempts: number;
  hintShown: boolean;
  /** The explanation (and, after a miss, the answer) is showing. */
  revealed: boolean;
  done: boolean;
  outcomes: Record<string, Outcome>;
}

/** Wrong tries allowed before the answer is shown. */
const MAX_ATTEMPTS = 2;

export const createPlayer = (): PlayerState => ({
  index: 0,
  attempts: 0,
  hintShown: false,
  revealed: false,
  done: false,
  outcomes: {},
});

export const currentStep = (lesson: Playable, state: PlayerState): Step | undefined =>
  state.done ? undefined : lesson.steps[state.index];

const isCorrect = (step: Step, response: Response): boolean | undefined => {
  if (step.kind === 'choice' && response.kind === 'choice') return response.index === step.answer;
  if (step.kind === 'move' && response.kind === 'move') return step.answers.includes(response.move);
  if (step.kind === 'square' && response.kind === 'square') return step.answers.includes(response.square);
  if (step.kind === 'play' && response.kind === 'play') return response.won;
  return undefined;
};

/** Show the answer. A step is graded the first time only: coming back to it later changes nothing. */
const reveal = (state: PlayerState, stepId: string, outcome: Outcome): PlayerState => ({
  ...state,
  revealed: true,
  outcomes: stepId in state.outcomes ? state.outcomes : { ...state.outcomes, [stepId]: outcome },
});

export function answer(
  lesson: Playable,
  state: PlayerState,
  response: Response,
): { state: PlayerState; correct: boolean } {
  const step = currentStep(lesson, state);
  const correct = step && !state.revealed ? isCorrect(step, response) : undefined;
  if (!step || correct === undefined) return { state, correct: false };

  if (correct) {
    const helped = state.attempts > 0 || state.hintShown;
    return { state: reveal(state, step.id, helped ? 'with-help' : 'first-try'), correct };
  }
  const attempts = state.attempts + 1;
  const next = { ...state, attempts };
  return { state: attempts >= MAX_ATTEMPTS ? reveal(next, step.id, 'missed') : next, correct };
}

export const showHint = (state: PlayerState): PlayerState => (state.revealed ? state : { ...state, hintShown: true });

export function giveUp(lesson: Playable, state: PlayerState): PlayerState {
  const step = currentStep(lesson, state);
  if (!step || step.kind === 'read' || state.revealed) return state;
  return reveal(state, step.id, 'missed');
}

export function advance(lesson: Playable, state: PlayerState): PlayerState {
  const step = currentStep(lesson, state);
  if (!step || (step.kind !== 'read' && !state.revealed)) return state;
  const index = state.index + 1;
  return {
    ...state,
    index,
    attempts: 0,
    hintShown: false,
    revealed: false,
    done: index >= lesson.steps.length,
  };
}

/** Go straight to any step (the step dots), starting it fresh. Earlier grades are kept. */
export function jumpTo(lesson: Playable, state: PlayerState, index: number): PlayerState {
  if (!Number.isInteger(index) || index < 0 || index >= lesson.steps.length) return state;
  return { ...state, index, attempts: 0, hintShown: false, revealed: false, done: false };
}
