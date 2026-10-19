import type { ReferenceEntry } from '@chaalwise/core/reference';

/** Reference search, small enough to run in the page with no dependencies. */

/** Lower case, without accents or apostrophes, so "Grünfeld" matches "grunfeld" and "King's" matches "kings". */
const fold = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'.]/g, '').toLowerCase();

/** What search looks at: the name, other names and the summary. */
export const searchText = (entry: Pick<ReferenceEntry, 'term' | 'summary'> & { aliases: readonly string[] }) =>
  fold([entry.term, ...entry.aliases, entry.summary].join(' '));

/** Whether every word of the query appears in an entry's search text. */
export const matchesQuery = (text: string, query: string) =>
  fold(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => text.includes(word));
