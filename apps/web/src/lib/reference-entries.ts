import { REFERENCE_GAMES } from '@chaalwise/core/reference';
import { getCollection, type CollectionEntry } from 'astro:content';

export type ReferenceItem = CollectionEntry<'reference'>;

const byTerm = (a: ReferenceItem, b: ReferenceItem) => a.data.term.localeCompare(b.data.term, 'en');

/** Every reference entry, by game (strategy first), then by name. */
export async function referenceEntries(): Promise<ReferenceItem[]> {
  const all = await getCollection('reference');
  return REFERENCE_GAMES.flatMap((game) => all.filter((e) => e.data.game === game).sort(byTerm));
}

/** The entries a lesson teaches, for its "look it up" links. */
export async function entriesForLesson(lessonId: string): Promise<ReferenceItem[]> {
  return (await referenceEntries()).filter((e) => e.data.lesson === lessonId);
}
