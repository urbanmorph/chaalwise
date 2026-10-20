import { describe, expect, it } from 'vitest';
import { calibration, CONFIDENCE } from '../src/calibration';
import type { Attempt } from '../src/profile';

const at = new Date('2026-10-20T09:00:00Z');
const said = (confidence: number, right: boolean): Attempt => ({
  skill: 'think-ahead',
  outcome: right ? 'first-try' : 'missed',
  at,
  confidence,
});

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
