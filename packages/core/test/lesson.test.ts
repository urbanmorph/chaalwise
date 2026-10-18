import { describe, expect, it } from 'vitest';
import { lessonSchema } from '../src/lesson';
import { lesson } from './fixtures';

describe('lessonSchema', () => {
  it('accepts a well-formed lesson', () => {
    expect(lessonSchema.parse(lesson)).toEqual(lesson);
  });

  it('rejects a choice whose answer is not one of its options', () => {
    const bad = structuredClone(lesson);
    bad.steps[1] = { ...bad.steps[1], answer: 2 } as (typeof bad.steps)[number];
    expect(() => lessonSchema.parse(bad)).toThrow(/answer/);
  });

  it('rejects two steps with the same id, because review cards are keyed by step id', () => {
    const bad = structuredClone(lesson);
    bad.steps[2] = { ...bad.steps[2]!, id: 'corner' };
    expect(() => lessonSchema.parse(bad)).toThrow(/duplicate step id/);
  });

  it('rejects an unknown skill', () => {
    expect(() => lessonSchema.parse({ ...lesson, skills: ['juggling'] })).toThrow();
  });

  it('rejects a lesson with no steps', () => {
    expect(() => lessonSchema.parse({ ...lesson, steps: [] })).toThrow();
  });
});
