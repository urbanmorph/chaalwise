import type { GradedStep } from '@chaalwise/core/lesson';
import { getCollection, type CollectionEntry } from 'astro:content';
import { PROFILE_SKILLS } from './profile-skills';

/**
 * The question corpus: one file per question, at `<game>/<idea>/<name>`.
 * Lessons, reference entries, labs and every practice round look questions up
 * here by id, so a question is written once and a new one is a new file.
 */
export type QuestionEntry = CollectionEntry<'questions'>;

/** A track nothing measures yet would show the answers nowhere, so they count towards nothing. */
const counted = (measures: string | undefined) =>
  PROFILE_SKILLS.some((s) => s.id === measures && s.later) ? undefined : measures;

/** A question as the player shows it: its id is its review card, the one it was saved under before the corpus if it has one. */
export function asStep({ id, data }: QuestionEntry): GradedStep {
  const { card, ...step } = data;
  return { ...step, id: card ?? id, measures: counted(step.measures) } as GradedStep;
}

let cache: Map<string, QuestionEntry> | undefined;

/** Every question, by id. */
export async function corpus(): Promise<Map<string, QuestionEntry>> {
  cache ??= new Map((await getCollection('questions')).map((q) => [q.id, q]));
  return cache;
}

/** The questions with these ids, as the player shows them. A missing id fails the build. */
export async function ask(ids: readonly string[]): Promise<GradedStep[]> {
  const all = await corpus();
  return ids.map((id) => {
    const question = all.get(id);
    if (!question) throw new Error(`no question ${id} in the corpus`);
    return asStep(question);
  });
}
