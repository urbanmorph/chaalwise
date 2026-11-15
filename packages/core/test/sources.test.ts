import { describe, expect, it } from 'vitest';
import { lessonSchema, questionSchema } from '../src/lesson';
import { referenceSchema } from '../src/reference';
import { licenceIssues, type Source } from '../src/sources';

const cc0: Source = { title: 'Lichess puzzle database', licence: 'CC0' };
const sa: Source = { title: 'A Wikipedia article', licence: 'CC-BY-SA' };
const nc: Source = { title: 'An open course', licence: 'CC-BY-NC' };
const nd: Source = { title: 'A report', licence: 'CC-BY-ND' };
const idea: Source = { title: 'Kahneman and Tversky 1979', licence: 'cited-idea' };

describe('what a source’s licence allows', () => {
  it('lets free content use anything but non-commercial sources, since the site will charge', () => {
    expect(licenceIssues(undefined, [cc0, sa, nd, idea])).toEqual([]);
    expect(licenceIssues('free', [nc])).toHaveLength(1);
  });

  it('keeps share-alike, non-commercial and no-derivatives sources out of paid content', () => {
    expect(licenceIssues('paid', [cc0, idea, { title: 'Ours', licence: 'own' }])).toEqual([]);
    expect(licenceIssues('paid', [sa, nc, nd])).toHaveLength(3);
  });

  it('is fine with no sources at all', () => {
    expect(licenceIssues('paid', undefined)).toEqual([]);
  });
});

describe('sources in the content schemas', () => {
  const lesson = {
    title: 'A lesson',
    summary: 'What it teaches.',
    game: 'chess',
    stage: 0,
    order: 0,
    skills: [],
    steps: [{ kind: 'read', id: 'one', text: 'Some text.' }],
  };
  const entry = { term: 'An idea', game: 'labs', kind: 'concept', level: 'beginner', summary: 'One line.' };
  const question = { kind: 'choice', prompt: 'Which?', options: ['a', 'b'], answer: 0, explanation: 'Because.' };

  it('accepts sources and a tier on lessons, reference entries and questions', () => {
    for (const schema of [lessonSchema, referenceSchema, questionSchema] as const) {
      const base = schema === lessonSchema ? lesson : schema === referenceSchema ? entry : question;
      expect(schema.safeParse({ ...base, tier: 'paid', sources: [cc0, idea] }).success).toBe(true);
    }
  });

  it('rejects a licence it does not know, and a source with no title', () => {
    expect(lessonSchema.safeParse({ ...lesson, sources: [{ title: 'X', licence: 'MIT' }] }).success).toBe(false);
    expect(referenceSchema.safeParse({ ...entry, sources: [{ licence: 'CC0' }] }).success).toBe(false);
  });

  it('fails the build on a source the content’s tier may not use', () => {
    expect(lessonSchema.safeParse({ ...lesson, tier: 'paid', sources: [sa] }).success).toBe(false);
    expect(referenceSchema.safeParse({ ...entry, sources: [nc] }).success).toBe(false);
    expect(questionSchema.safeParse({ ...question, tier: 'paid', sources: [nd] }).success).toBe(false);
  });
});
