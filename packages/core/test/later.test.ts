import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { laterCaseSchema } from '../src/lesson';
import { caseToOffer, usedIdea, usedShare, type LaterRecord } from '../src/later';
import { openProgress } from '../src/progress';

const day = 86_400_000;
const now = new Date('2026-11-15T09:00:00Z');
const ago = (days: number) => new Date(now.getTime() - days * day);
const record = (fields: Partial<LaterRecord> = {}): LaterRecord => ({
  caseId: 'later/the-tea-stall',
  idea: 'strategy/blunder-check',
  used: true,
  right: 2,
  of: 2,
  at: now,
  ...fields,
});

describe('a case a week later, which does not say which idea it tests', () => {
  const cases = [
    { id: 'later/a', idea: 'strategy/blunder-check' },
    { id: 'later/b', idea: 'strategy/look-at-three' },
    { id: 'later/c', idea: 'poker/expected-value' },
  ];

  it('is offered seven days after its idea was finished, not sooner', () => {
    expect(caseToOffer(cases, [{ lessonId: 'strategy/blunder-check', completedAt: ago(6) }], [], now)).toBeUndefined();
    expect(caseToOffer(cases, [{ lessonId: 'strategy/blunder-check', completedAt: ago(7) }], [], now)?.id).toBe(
      'later/a',
    );
  });

  it('offers the one whose idea was finished longest ago, one at a time, and never one already done', () => {
    const finished = [
      { lessonId: 'strategy/blunder-check', completedAt: ago(9) },
      { lessonId: 'strategy/look-at-three', completedAt: ago(20) },
      { lessonId: 'poker/expected-value', completedAt: ago(30) },
    ];
    expect(caseToOffer(cases, finished, [], now)?.id).toBe('later/c');
    expect(caseToOffer(cases, finished, [record({ caseId: 'later/c' })], now)?.id).toBe('later/b');
    const all = cases.map((c) => record({ caseId: c.id }));
    expect(caseToOffer(cases, finished, all, now)).toBeUndefined();
  });

  it('needs the idea finished at all', () => {
    expect(caseToOffer(cases, [{ lessonId: 'chess/board', completedAt: ago(30) }], [], now)).toBeUndefined();
  });

  it('counts the idea as used when every decision was right first time', () => {
    expect(usedIdea({ a: 'first-try', b: 'first-try' })).toEqual({ used: true, right: 2, of: 2 });
    expect(usedIdea({ a: 'first-try', b: 'with-help', c: 'missed' })).toEqual({ used: false, right: 1, of: 3 });
  });

  it('gives the share of cases where the idea was used unprompted', () => {
    expect(usedShare([])).toEqual({ used: 0, of: 0 });
    expect(usedShare([record(), record({ caseId: 'later/b', used: false })])).toEqual({ used: 1, of: 2 });
  });

  it('is written as a case: reading, then two or three decisions from the corpus, and the idea it tests', () => {
    const steps = [
      { kind: 'read', id: 'intro', text: 'You run a tea stall in Pune.' },
      { ask: 'later/tea-stall/first' },
      { ask: 'later/tea-stall/second' },
    ];
    expect(laterCaseSchema.parse({ title: 'The tea stall', idea: 'strategy/blunder-check', steps })).toBeTruthy();
    expect(() =>
      laterCaseSchema.parse({ title: 'T', idea: 'strategy/blunder-check', steps: steps.slice(0, 2) }),
    ).toThrow(/two or three decisions/);
    const four = [...steps, { ask: 'later/tea-stall/third' }, { ask: 'later/tea-stall/fourth' }];
    expect(() => laterCaseSchema.parse({ title: 'T', idea: 'strategy/blunder-check', steps: four })).toThrow();
    // The idea is a lesson or a lab the learner finishes, never a chess lesson or a work case.
    expect(() => laterCaseSchema.parse({ title: 'T', idea: 'cases/cafe-supplier', steps })).toThrow();
    expect(laterCaseSchema.parse({ title: 'T', idea: 'labs/split-the-pie', steps })).toBeTruthy();
  });
});

describe('the cases a week later, kept on the device', () => {
  let n = 0;
  const fresh = () => openProgress(`later-${++n}`);

  it('records each case by its id, and reads back when each lesson was finished', async () => {
    const store = await fresh();
    await store.recordLesson('strategy/blunder-check', {}, ago(8));
    await store.recordLater(record({ used: false, right: 1 }));
    await store.recordLater(record());
    expect(await store.records('later')).toEqual([record()]);
    expect(await store.records('lessons')).toMatchObject([{ lessonId: 'strategy/blunder-check', completedAt: ago(8) }]);
    store.close();
  });

  it('carries them through an export, and still reads a file made before they existed', async () => {
    const store = await fresh();
    await store.recordLater(record());
    const exported = JSON.parse(JSON.stringify(await store.exportData(now)));
    store.close();

    const other = await fresh();
    await other.importData(exported);
    expect(await other.records('later')).toEqual([record()]);
    await other.importData({ app: 'chaalwise', version: 1, exportedAt: now.toISOString(), lessons: [], cards: [] });
    expect(await other.records('later')).toEqual([]);
    other.close();
  });
});
