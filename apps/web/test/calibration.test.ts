import type { SettingScore } from '@chaalwise/core/calibration-score';
import type { GradedStep } from '@chaalwise/core/lesson';
import { describe, expect, it } from 'vitest';
import { across, advice, apart, scoreLine } from '../src/lib/calibration';
import { CALIBRATION_ROUND, calibrationIds } from '../src/lib/round-items';
import { settingOf } from '../src/lib/games';

const choice = (fields: Partial<GradedStep> = {}) =>
  ({
    kind: 'choice',
    id: 'q',
    prompt: 'p',
    options: ['a', 'b'],
    answer: 0,
    explanation: 'e',
    measures: 'think-ahead',
    ...fields,
  }) as GradedStep;

describe('where a question is set, for calibration by setting', () => {
  it('places chess and poker questions, lab debriefs, and the rest in life', () => {
    expect(settingOf('chess/hanging/free-knight', choice())).toBe('chess');
    expect(settingOf('strategy/blunder-check/compare', choice({ position: 'start' } as Partial<GradedStep>))).toBe(
      'chess',
    );
    expect(settingOf('poker/outs/count', choice())).toBe('poker');
    expect(settingOf('reference/labs/prisoners-dilemma/repeat', choice())).toBe('labs');
    expect(settingOf('strategy/blunder-check/angry-email', choice())).toBe('life');
    expect(settingOf('cases/first-job/offer', choice())).toBe('life');
  });
});

describe('a calibration round', () => {
  const steps: Record<string, GradedStep> = Object.fromEntries([
    ...Array.from({ length: 12 }, (_, i) => [`life/x/${i}`, choice()]),
    ...Array.from({ length: 4 }, (_, i) => [`chess/x/${i}`, choice()]),
    ...Array.from({ length: 4 }, (_, i) => [`poker/x/${i}`, choice()]),
    ['chess/x/move', { kind: 'move', id: 'q', prompt: 'p', position: 'start', answers: ['e2e4'], explanation: 'e' }],
    ['life/x/unmeasured', choice({ measures: undefined })],
  ]);

  it(`deals ${CALIBRATION_ROUND} questions from each setting in turn`, () => {
    const ids = calibrationIds(steps, CALIBRATION_ROUND, () => 0.4);
    expect(ids).toHaveLength(CALIBRATION_ROUND);
    expect(new Set(ids).size).toBe(CALIBRATION_ROUND);
    const settings = ids.map((id) => id.split('/')[0]);
    expect(settings.filter((s) => s === 'chess')).toHaveLength(3);
    expect(settings.filter((s) => s === 'poker')).toHaveLength(3);
    for (let i = 1; i < 9; i++) expect(settings[i], ids.join()).not.toBe(settings[i - 1]);
  });

  it('asks only questions with options, which a sureness fits, and that count towards a skill, so the answer is kept', () => {
    const ids = calibrationIds(steps, 30, Math.random);
    expect(ids).not.toContain('chess/x/move');
    expect(ids).not.toContain('life/x/unmeasured');
    expect(ids).toHaveLength(20);
  });
});

describe('what the score says', () => {
  it('gives the score in plain words, and how often you were right against how sure you said', () => {
    expect(scoreLine({ answers: 10, brier: 0.2149, said: 0.76, right: 0.6 })).toBe(
      'Score 0.21. You said 76% sure on average and were right 60% of the time.',
    );
  });

  it('says what to do when overconfident, underconfident, or well judged', () => {
    expect(advice('overconfident', 'on life questions')).toBe(
      'You are overconfident on life questions: you were right less often than you said. Slow down and look for what could make you wrong.',
    );
    expect(advice('underconfident', 'on chess questions')).toMatch(/^You are underconfident on chess questions: /);
    expect(advice('matched', 'in this round')).toMatch(/^Your sureness matched your results in this round\./);
  });

  it('says when your surest answers are right no more often than your least sure', () => {
    expect(apart(false)).toMatch(/^Your surest answers were right no more often than your least sure ones/);
    expect(apart(true)).toBeUndefined();
    expect(apart(undefined)).toBeUndefined();
  });

  it('says whether sureness carries across settings, once two settings have a score', () => {
    const row = (setting: SettingScore['setting'], said: number, right: number): SettingScore => ({
      setting,
      answers: 10,
      score: { answers: 10, brier: 0.2, said, right },
    });
    const none: SettingScore = { setting: 'labs', answers: 3, score: undefined };
    expect(across([row('chess', 0.7, 0.7), none])).toBeUndefined();
    expect(across([row('chess', 0.7, 0.7), row('life', 0.9, 0.5)])).toMatch(/^Your sureness does not carry across/);
    expect(across([row('chess', 0.7, 0.7), row('life', 0.7, 0.8)])).toMatch(/^Your sureness carries across/);
    expect(across([row('chess', 0.9, 0.6), row('life', 0.9, 0.5)])).toMatch(/^You are overconfident in every setting/);
  });
});
