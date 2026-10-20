import { describe, expect, it } from 'vitest';
import type { Outcome } from '../src/player';
import { assess, focusOrder, levelName, type Attempt } from '../src/profile';

const day = (n: number) => new Date(Date.UTC(2026, 9, 1 + n, 9));
/** `pattern` is one letter per attempt: f first try, h with help, m missed. Attempts spread over `days`. */
const attempts = (pattern: string, days = 1): Attempt[] =>
  [...pattern].map((c, i) => ({
    skill: 'safety',
    outcome: ({ f: 'first-try', h: 'with-help', m: 'missed' } as Record<string, Outcome>)[c]!,
    at: day(Math.floor((i * days) / pattern.length)),
  }));

describe('a skill level from your own record', () => {
  it('is not started with no evidence', () => {
    expect(assess([])).toMatchObject({ level: 'not-started' });
  });

  it('is Noticing once you have met it', () => {
    expect(assess(attempts('fm'))).toMatchObject({ level: 'noticing', firstTry: 1, total: 2 });
  });

  it('is Applying with five or more tries and six in ten first time', () => {
    expect(assess(attempts('ffffhhff')).level).toBe('applying');
    expect(assess(attempts('ffmmmmff')).level).toBe('noticing');
  });

  it('is Reliable with twelve or more tries, four in five first time, over at least two days', () => {
    expect(assess(attempts('ffffffffffhf', 2)).level).toBe('reliable');
    // The same record in a single sitting is not yet reliable: it has to hold up on another day.
    expect(assess(attempts('ffffffffffhf', 1)).level).toBe('applying');
  });

  it('is Fluent with twenty or more tries, nine in ten first time, over at least three days: a quiz shows fluency, not instinct', () => {
    expect(levelName('instinctive')).toBe('Fluent');
    expect(assess(attempts('fffffffffffffffffffh', 3)).level).toBe('instinctive');
    expect(assess(attempts('fffffffffffffffffffh', 2)).level).toBe('reliable');
  });

  it('looks at your recent record, so a level can go back down, and says why', () => {
    const slipped = assess(attempts('ffffffffffffffffffff' + 'mmmmmmfmmm', 3));
    expect(slipped.level).toBe('noticing');
    expect(slipped.reason).toBe('You got 11 of your last 20 first time, over 2 days.');
  });

  it('says what the next level needs', () => {
    expect(assess(attempts('fm')).next).toBe('For Applying: at least 5 tries, and 6 in 10 first time.');
    expect(assess(attempts('fffffffffffffffffffh', 3)).next).toBeUndefined();
  });
});

describe('a level that means something', () => {
  const on = (n: number, fields: Partial<Attempt>, outcome: Outcome = 'first-try'): Attempt => ({
    skill: 'safety',
    outcome,
    at: day(n),
    ...fields,
  });

  it('counts one answer per question per day, so repeating a question in one sitting proves nothing new', () => {
    const repeated = Array.from({ length: 8 }, () => on(0, { item: 'q1' }));
    expect(assess(repeated)).toMatchObject({ level: 'noticing', total: 1 });
    // The same question on another day counts again.
    expect(assess([on(0, { item: 'q1' }), on(1, { item: 'q1' })]).total).toBe(2);
  });

  it('allows for lucky guesses: a wrong answer between two options costs what a guess would have won', () => {
    const outcomes = [...'ffffffmmmm'].map((c, i) =>
      on(0, { item: `q${i}`, chance: 0.5 }, c === 'f' ? 'first-try' : 'missed'),
    );
    expect(assess(outcomes).level).toBe('noticing');
    // The same record on moves, where nothing can be guessed, is Applying.
    expect(assess(outcomes.map((a) => ({ ...a, chance: 0 }))).level).toBe('applying');
  });

  it('needs different questions for the higher levels, not the same few again', () => {
    const few = Array.from({ length: 14 }, (_, i) => on(i % 3, { item: `q${i % 4}` }));
    expect(assess(few).level).toBe('applying');
    const varied = Array.from({ length: 14 }, (_, i) => on(i % 3, { item: `q${i}` }));
    expect(assess(varied).level).toBe('reliable');
  });
});

describe('next focus', () => {
  const order = ['board', 'safety', 'patterns'];

  it('picks the weakest skill you have started', () => {
    const profile = {
      board: assess(attempts('ffffffffffhf', 2)),
      safety: assess(attempts('fmm')),
      patterns: assess([]),
    };
    expect(focusOrder(profile, order)[0]).toBe('safety');
  });

  it('breaks a tie by the lower first-time rate', () => {
    const profile = { board: assess(attempts('fmf')), safety: assess(attempts('fmm')), patterns: assess([]) };
    expect(focusOrder(profile, order)[0]).toBe('safety');
  });

  it('starts the first skill in the order when nothing has been started', () => {
    expect(focusOrder({ board: assess([]), safety: assess([]), patterns: assess([]) }, order)[0]).toBe('board');
  });

  it('moves on to a new skill once every started one is reliable', () => {
    const solid = assess(attempts('ffffffffffhf', 2));
    expect(focusOrder({ board: solid, safety: solid, patterns: assess([]) }, order)[0]).toBe('patterns');
  });

  it('ranks every skill: weak ones started, then new ones in order, then the solid ones', () => {
    const solid = assess(attempts('ffffffffffhf', 2));
    const profile = { board: solid, safety: assess(attempts('fmm')), patterns: assess([]) };
    expect(focusOrder(profile, order)).toEqual(['safety', 'patterns', 'board']);
  });
});
