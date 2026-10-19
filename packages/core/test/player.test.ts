import { describe, expect, it } from 'vitest';
import { advance, answer, createPlayer, currentStep, giveUp, showHint } from '../src/player';
import { lesson } from './fixtures';

const atStep = (index: number) => ({ ...createPlayer(), index });

describe('lesson player', () => {
  it('starts on the first step', () => {
    const state = createPlayer();
    expect(currentStep(lesson, state)?.id).toBe('intro');
    expect(state.done).toBe(false);
  });

  it('moves past a read step without grading it', () => {
    const state = advance(lesson, createPlayer());
    expect(currentStep(lesson, state)?.id).toBe('corner');
    expect(state.outcomes).toEqual({});
  });

  it('will not advance past a graded step that has not been answered', () => {
    const state = atStep(1);
    expect(advance(lesson, state)).toBe(state);
  });

  it('grades a first-try correct answer and reveals the explanation', () => {
    const { state, correct } = answer(lesson, atStep(1), { kind: 'choice', index: 1 });
    expect(correct).toBe(true);
    expect(state.revealed).toBe(true);
    expect(state.outcomes).toEqual({ corner: 'first-try' });
  });

  it('counts a correct answer after a wrong one as needing help', () => {
    let { state } = answer(lesson, atStep(1), { kind: 'choice', index: 0 });
    expect(state.revealed).toBe(false);
    ({ state } = answer(lesson, state, { kind: 'choice', index: 1 }));
    expect(state.outcomes).toEqual({ corner: 'with-help' });
  });

  it('counts a correct answer after a hint as needing help', () => {
    const hinted = showHint(atStep(2));
    expect(hinted.hintShown).toBe(true);
    const { state } = answer(lesson, hinted, { kind: 'move', move: 'e2e4' });
    expect(state.outcomes).toEqual({ push: 'with-help' });
  });

  it('reveals the answer and records a miss after two wrong tries', () => {
    let { state } = answer(lesson, atStep(2), { kind: 'move', move: 'd2d4' });
    ({ state } = answer(lesson, state, { kind: 'move', move: 'g1f3' }));
    expect(state.revealed).toBe(true);
    expect(state.outcomes).toEqual({ push: 'missed' });
  });

  it('records a miss when the learner gives up', () => {
    const state = giveUp(lesson, atStep(2));
    expect(state.revealed).toBe(true);
    expect(state.outcomes).toEqual({ push: 'missed' });
  });

  it('ignores answers once the step is revealed, so the grade cannot change', () => {
    const { state } = answer(lesson, atStep(1), { kind: 'choice', index: 0 });
    const missed = giveUp(lesson, state);
    const after = answer(lesson, missed, { kind: 'choice', index: 1 });
    expect(after.state).toBe(missed);
    expect(after.state.outcomes).toEqual({ corner: 'missed' });
  });

  it('rejects a response of the wrong kind for the step', () => {
    const state = atStep(1);
    expect(answer(lesson, state, { kind: 'move', move: 'e2e4' }).state).toBe(state);
  });

  it('finishes after the last step', () => {
    const { state } = answer(lesson, atStep(2), { kind: 'move', move: 'e2e4' });
    const done = advance(lesson, state);
    expect(done.done).toBe(true);
    expect(currentStep(lesson, done)).toBeUndefined();
  });

  it('resets attempts and hints for the next step', () => {
    let { state } = answer(lesson, showHint(atStep(1)), { kind: 'choice', index: 0 });
    ({ state } = answer(lesson, state, { kind: 'choice', index: 1 }));
    const next = advance(lesson, state);
    expect(next).toMatchObject({ index: 2, attempts: 0, hintShown: false, revealed: false });
  });
});

describe('square and play steps', () => {
  const steps = {
    steps: [
      { kind: 'square' as const, id: 'find', prompt: 'Find e4.', answers: ['e4'], explanation: 'e' },
      {
        kind: 'play' as const,
        id: 'mate',
        prompt: 'Mate.',
        position: 'p',
        goal: 'checkmate' as const,
        within: 10,
        opponent: 'lone-king' as const,
        explanation: 'e',
      },
    ],
  };

  it('grades a picked square', () => {
    expect(answer(steps, createPlayer(), { kind: 'square', square: 'e4' }).state.outcomes).toEqual({
      find: 'first-try',
    });
    expect(answer(steps, createPlayer(), { kind: 'square', square: 'd4' }).correct).toBe(false);
  });

  it('grades a played-out position by its result, and lets the learner try again', () => {
    const atPlay = { ...createPlayer(), index: 1 };
    const lost = answer(steps, atPlay, { kind: 'play', won: false });
    expect(lost.state).toMatchObject({ attempts: 1, revealed: false });
    expect(answer(steps, lost.state, { kind: 'play', won: true }).state.outcomes).toEqual({ mate: 'with-help' });
  });
});
