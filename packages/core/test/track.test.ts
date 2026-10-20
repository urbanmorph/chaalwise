import { describe, expect, it } from 'vitest';
import { trackSchema } from '../src/track';

const course = {
  idea: 'See how others will respond before you act.',
  why: 'Most mistakes are replies you did not look for.',
  atWork: 'Before the price change, ask what the competitor will do.',
  inStudy: 'Before handing in, ask what the examiner will look for first.',
  habit: 'What will they do next?',
};

describe('a strategy track as a course', () => {
  it('takes the idea, why it matters, an example at work and one in study, and the habit to keep', () => {
    expect(trackSchema.parse(course)).toEqual(course);
  });

  it('needs every part', () => {
    for (const field of Object.keys(course)) {
      const rest: Partial<typeof course> = { ...course };
      delete rest[field as keyof typeof course];
      expect(trackSchema.safeParse(rest).success, field).toBe(false);
    }
  });

  it('asks the habit as a question', () => {
    expect(trackSchema.safeParse({ ...course, habit: 'Look ahead.' }).success).toBe(false);
  });
});
