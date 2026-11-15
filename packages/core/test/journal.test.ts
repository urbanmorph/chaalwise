import { describe, expect, it } from 'vitest';
import { exportSchema } from '../src/progress-file';
import { journalId, localDay, toLookBack, type DecisionEntry, type JournalEntry } from '../src/journal';

const now = new Date('2026-11-20T09:00:00Z');
const decision = (fields: Partial<DecisionEntry> = {}): DecisionEntry => ({
  id: 'decision-1',
  kind: 'decision',
  createdAt: new Date('2026-11-10T09:00:00Z'),
  deciding: 'Whether to take the internship in Pune',
  expect: 'I will learn more than in Bengaluru',
  sure: 70,
  lookBackOn: new Date('2026-11-19T00:00:00Z'),
  ...fields,
});
const reflection: JournalEntry = {
  id: 'reflection-1',
  kind: 'reflection',
  createdAt: new Date('2026-11-01T09:00:00Z'),
  from: 'labs/nim',
  title: 'Nim',
  same: 'Counting back from the end',
  change: 'Choosing who starts',
};

describe('looking back at a decision', () => {
  it('waits for the date the learner chose', () => {
    expect(toLookBack([decision({ lookBackOn: new Date('2026-11-21T00:00:00Z') })], now)).toBeUndefined();
    expect(toLookBack([decision()], now)?.id).toBe('decision-1');
  });

  it('asks once: a decision already looked back on is not asked again, and reflections are never asked', () => {
    const done = decision({ lookedBack: { at: now, happened: 'It went well', judged: 'sound' } });
    expect(toLookBack([done, reflection], now)).toBeUndefined();
  });

  it('asks about the earliest date first', () => {
    const earlier = decision({ id: 'decision-0', lookBackOn: new Date('2026-11-15T00:00:00Z') });
    expect(toLookBack([decision(), earlier], now)?.id).toBe('decision-0');
  });

  it('reads the date picker as the start of that day where the learner is', () => {
    const day = localDay('2026-11-19');
    expect([day.getFullYear(), day.getMonth(), day.getDate(), day.getHours()]).toEqual([2026, 10, 19, 0]);
  });

  it('names each entry by its kind and when it was written, nothing else', () => {
    expect(journalId('decision', now)).toBe(`decision-${now.getTime()}`);
  });
});

describe('the journal in the progress file', () => {
  const file = { app: 'chaalwise', version: 1, exportedAt: now.toISOString(), lessons: [], cards: [] };

  it('reads files from before the journal, with none', () => {
    expect(exportSchema.parse(file).journal).toEqual([]);
  });

  it('carries decisions and reflections, and refuses a percentage out of range', () => {
    const looked = decision({ lookedBack: { at: now, happened: 'Fine', judged: 'unsure' } });
    const entries = JSON.parse(JSON.stringify([looked, reflection]));
    expect(exportSchema.parse({ ...file, journal: entries }).journal).toEqual([looked, reflection]);
    expect(() => exportSchema.parse({ ...file, journal: [{ ...entries[0], sure: 120 }] })).toThrow();
  });

  it('reads plan check-ins of every kind, including the earlier "used" and "forgot"', () => {
    const plan = { id: 'p', track: 't', text: 'When a, I will b.', createdAt: now.toISOString() };
    const results = ['used', 'forgot', 'no-chance', 'noticed', 'acted', 'not-noticed'];
    const checkIns = results.map((result) => ({ at: now.toISOString(), result }));
    const parsed = exportSchema.parse({ ...file, plans: [{ ...plan, checkIns }] });
    expect(parsed.plans[0]!.checkIns.map((c) => c.result)).toEqual(results);
  });
});
