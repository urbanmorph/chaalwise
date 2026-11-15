import { describe, expect, it } from 'vitest';
import { calibration, CONFIDENCE } from '../src/calibration';
import { MIN_ANSWERS, score, settingScores, tellsApart, verdict, type Setting } from '../src/calibration-score';
import type { Attempt } from '../src/profile';

const at = new Date('2026-10-20T09:00:00Z');
const said = (confidence: number, right: boolean, item?: string): Attempt => ({
  skill: 'think-ahead',
  outcome: right ? 'first-try' : 'missed',
  at,
  confidence,
  item,
});
/** `n` answers at one level, `right` of them right. */
const many = (n: number, confidence: number, right: number, item?: string): Attempt[] =>
  Array.from({ length: n }, (_, i) => said(confidence, i < right, item));

describe('how sure you were, against how often you were right', () => {
  it('offers three levels of sureness', () => {
    expect(CONFIDENCE).toEqual([0.5, 0.7, 0.9]);
  });

  it('counts, for each level, how many answers and how many were right first time', () => {
    const rows = calibration([
      said(0.9, true),
      said(0.9, false),
      said(0.9, true),
      said(0.5, true),
      { skill: 'x', outcome: 'missed', at },
    ]);
    expect(rows).toEqual([
      { confidence: 0.5, answers: 1, right: 1 },
      { confidence: 0.7, answers: 0, right: 0 },
      { confidence: 0.9, answers: 3, right: 2 },
    ]);
  });
});

describe('the Brier score: how close your sureness was to what happened', () => {
  it('is the average squared gap between how sure you were and what happened (1 right, 0 wrong)', () => {
    // (0.9 − 1)² = 0.01, (0.9 − 0)² = 0.81, (0.5 − 1)² = 0.25, (0.7 − 0)² = 0.49: 1.56 over 4 answers is 0.39.
    const s = score([said(0.9, true), said(0.9, false), said(0.5, true), said(0.7, false)])!;
    expect(s.answers).toBe(4);
    expect(s.brier).toBeCloseTo(0.39, 10);
    // Said 75% sure on average (3.0 / 4), right 2 of 4 times.
    expect(s.said).toBeCloseTo(0.75, 10);
    expect(s.right).toBe(0.5);
  });

  it('scores 0.25 for always saying 50%, whatever happens', () => {
    expect(score([said(0.5, true), said(0.5, false), said(0.5, false)])!.brier).toBeCloseTo(0.25, 10);
  });

  it('scores 7 right of 10 at 70% sure as 0.21: (7 × 0.09 + 3 × 0.49) / 10', () => {
    expect(score(many(10, 0.7, 7))!.brier).toBeCloseTo(0.21, 10);
  });

  it('counts only answers where you said how sure you were; a help or hint is not right first time', () => {
    const s = score([
      said(0.9, true),
      { skill: 'x', outcome: 'first-try', at },
      { ...said(0.9, true), outcome: 'with-help' },
    ])!;
    expect(s.answers).toBe(2);
    // (0.9 − 1)² = 0.01 and (0.9 − 0)² = 0.81: 0.41.
    expect(s.brier).toBeCloseTo(0.41, 10);
  });

  it('has no score with no answers to score', () => {
    expect(score([{ skill: 'x', outcome: 'first-try', at }])).toBeUndefined();
  });
});

describe('over- or underconfident', () => {
  it('is overconfident when you were right more than 10 points less often than you said', () => {
    expect(verdict(score([...many(5, 0.9, 3)])!)).toBe('overconfident'); // said 90%, right 60%
  });

  it('is underconfident when you were right more than 10 points more often than you said', () => {
    expect(verdict(score(many(4, 0.5, 4))!)).toBe('underconfident'); // said 50%, right 100%
  });

  it('matches when the gap is 10 points or less either way', () => {
    expect(verdict(score(many(10, 0.7, 7))!)).toBe('matched');
    expect(verdict(score(many(10, 0.7, 8))!)).toBe('matched'); // right 80% after saying 70%
    expect(verdict(score(many(10, 0.9, 8))!)).toBe('matched');
  });
});

describe('telling right from wrong: are your surest answers right more often?', () => {
  it('is true when the highest level you used is right more often than the lowest', () => {
    expect(tellsApart(calibration([...many(5, 0.5, 2), ...many(5, 0.9, 4)]))).toBe(true);
  });

  it('is false when your surest answers are right no more often than your least sure', () => {
    expect(tellsApart(calibration([...many(5, 0.5, 3), ...many(6, 0.9, 3)]))).toBe(false);
  });

  it('cannot say until two levels each have 5 answers', () => {
    expect(tellsApart(calibration([...many(5, 0.5, 2), ...many(4, 0.9, 4)]))).toBeUndefined();
    expect(tellsApart(calibration(many(20, 0.7, 10)))).toBeUndefined();
  });
});

describe('scores by setting: chess, poker, labs and life', () => {
  const settingOf = (item: string | undefined): Setting | undefined =>
    item === 'c' ? 'chess' : item === 'p' ? 'poker' : item === 'l' ? 'life' : undefined;

  it(`shows a setting's score only from ${MIN_ANSWERS} answers, and counts the answers so far below that`, () => {
    const rows = settingScores([...many(MIN_ANSWERS, 0.9, 6, 'c'), ...many(MIN_ANSWERS - 1, 0.7, 7, 'p')], settingOf);
    expect(rows.map((r) => r.setting)).toEqual(['chess', 'poker', 'labs', 'life']);
    const [chess, poker, labs] = rows;
    expect(chess!.answers).toBe(10);
    // Said 90% ten times, right six: (6 × 0.01 + 4 × 0.81) / 10 = 0.33.
    expect(chess!.score!.brier).toBeCloseTo(0.33, 10);
    expect(poker).toEqual({ setting: 'poker', answers: 9, score: undefined });
    expect(labs).toEqual({ setting: 'labs', answers: 0, score: undefined });
  });

  it('leaves out answers from questions it cannot place, and those with no sureness', () => {
    const rows = settingScores([said(0.9, true, 'gone'), { skill: 'x', outcome: 'missed', at, item: 'l' }], settingOf);
    expect(rows.every((r) => r.answers === 0)).toBe(true);
  });
});
