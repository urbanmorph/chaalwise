import { KIND_NAMES, type ReferenceEntry } from '@chaalwise/core/reference';
import type { Drill } from './drill-list';
import { lessonHref } from './lesson-href';
import { entryHref } from './reference';
import { searchText } from './search';

/** One thing the reference search can find: an entry to read, a lesson to work through, or a drill to practise. */
export interface LibraryItem {
  type: 'entry' | 'lesson' | 'practice';
  game: string;
  title: string;
  href: string;
  meta: string;
  summary: string;
  search: string;
}

type EntryLike = {
  id: string;
  data: Pick<ReferenceEntry, 'term' | 'game' | 'kind' | 'level' | 'summary'> & { aliases: readonly string[] };
};
type LessonLike = { id: string; data: { title: string; summary: string; game: string; stage: number } };

/** Everything searchable, in one list: reference entries, then lessons in path order, then drills. */
export function libraryItems(
  entries: readonly EntryLike[],
  lessons: readonly LessonLike[],
  drills: readonly (Drill & { game: 'chess' | 'poker' })[],
): LibraryItem[] {
  return [
    ...entries.map(({ id, data }) => ({
      type: 'entry' as const,
      game: data.game,
      title: data.term,
      href: entryHref(id),
      meta: `${KIND_NAMES[data.kind]}, ${data.level}`,
      summary: data.summary,
      search: searchText(data),
    })),
    ...lessons.map((lesson) => ({
      type: 'lesson' as const,
      game: lesson.data.game,
      title: lesson.data.title,
      href: lessonHref(lesson),
      meta: lesson.data.game === 'strategy' ? 'Strategy lesson' : `Lesson, stage ${lesson.data.stage}`,
      summary: lesson.data.summary,
      search: searchText({ term: lesson.data.title, aliases: [], summary: lesson.data.summary }),
    })),
    ...drills.map((drill) => ({
      type: 'practice' as const,
      game: drill.game,
      title: drill.title,
      href: `/${drill.game}/drills/#${drill.id}`,
      meta: 'Practice drill',
      summary: drill.summary,
      search: searchText({ term: drill.title, aliases: [], summary: drill.summary }),
    })),
  ];
}
