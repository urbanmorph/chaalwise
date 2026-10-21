import { describe, expect, it } from 'vitest';
import { advance, answer, createPlayer, currentStep, giveUp, jumpTo, showHint } from '../src/player';
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

  it('moves past a graded step right first time before, such as in the check, without asking it again', () => {
    const state = { ...atStep(1), outcomes: { corner: 'first-try' as const } };
    expect(currentStep(lesson, advance(lesson, state))?.id).toBe('push');
  });

  it('asks again a step missed before: it must be answered to move on', () => {
    const state = { ...atStep(1), outcomes: { corner: 'missed' as const } };
    expect(advance(lesson, state)).toBe(state);
  });

  it('grades a first-try correct answer and reveals the explanation', () => {
    const { state, correct } = answer(lesson, atStep(1), { kind: 'choice', index: 1 });
    expect(correct).toBe(true);
    expect(state.revealed).toBe(true);
    expect(state.outcomes).toEqual({ corner: 'first-try' });
  });

  it('counts a correct answer after a wrong one as needing help, when the second try is still a real choice', () => {
    const four = { steps: [{ ...lesson.steps[1]!, options: ['a1', 'h1', 'a8', 'h8'] }] } as typeof lesson;
    let { state } = answer(four, createPlayer(), { kind: 'choice', index: 0 });
    expect(state.revealed).toBe(false);
    ({ state } = answer(four, state, { kind: 'choice', index: 1 }));
    expect(state.outcomes).toEqual({ corner: 'with-help' });
  });

  it('counts it as missed when only two or three options were left to guess from, so it comes back soon', () => {
    let { state } = answer(lesson, atStep(1), { kind: 'choice', index: 0 });
    ({ state } = answer(lesson, state, { kind: 'choice', index: 1 }));
    expect(state.outcomes).toEqual({ corner: 'missed' });
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

describe('moving between steps', () => {
  it('jumps to any step, fresh: no attempts, no hint, nothing revealed', () => {
    const started = showHint({ ...createPlayer(), index: 1, attempts: 1 });
    expect(jumpTo(lesson, started, 2)).toMatchObject({
      index: 2,
      attempts: 0,
      hintShown: false,
      revealed: false,
      done: false,
    });
  });

  it('ignores a jump outside the lesson', () => {
    const state = createPlayer();
    expect(jumpTo(lesson, state, 7)).toBe(state);
    expect(jumpTo(lesson, state, -1)).toBe(state);
  });

  it('grades a step only the first time: coming back and answering again does not change it', () => {
    let { state } = answer(lesson, { ...createPlayer(), index: 1 }, { kind: 'choice', index: 0 });
    state = giveUp(lesson, state);
    expect(state.outcomes).toEqual({ corner: 'missed' });
    const again = answer(lesson, jumpTo(lesson, state, 1), { kind: 'choice', index: 1 });
    expect(again.correct).toBe(true);
    expect(again.state.revealed).toBe(true);
    expect(again.state.outcomes).toEqual({ corner: 'missed' });
  });

  it('keeps earlier outcomes when jumping', () => {
    const { state } = answer(lesson, { ...createPlayer(), index: 1 }, { kind: 'choice', index: 1 });
    expect(jumpTo(lesson, state, 0).outcomes).toEqual({ corner: 'first-try' });
  });
});
