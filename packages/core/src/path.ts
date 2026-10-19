/** What the path needs to know about a lesson. */
export interface PathEntry {
  id: string;
  game: string;
  stage: number;
  order: number;
  /** Strategy lessons: the lesson they follow. */
  after?: string | undefined;
}

/**
 * The recommended order: game lessons by stage and order, each followed by the
 * strategy lessons that come after it (which may themselves be followed by others).
 */
export function learningPath<T extends PathEntry>(lessons: readonly T[]): T[] {
  const ids = new Set(lessons.map((l) => l.id));
  const following = new Map<string, T[]>();
  for (const lesson of lessons) {
    if (lesson.after === undefined) continue;
    if (!ids.has(lesson.after)) throw new Error(`${lesson.id} comes after ${lesson.after}, which does not exist`);
    following.set(
      lesson.after,
      [...(following.get(lesson.after) ?? []), lesson].sort((a, b) => a.order - b.order),
    );
  }
  const path: T[] = [];
  const visit = (lesson: T) => {
    path.push(lesson);
    for (const next of following.get(lesson.id) ?? []) visit(next);
  };
  lessons
    .filter((l) => l.after === undefined)
    .sort((a, b) => a.stage - b.stage || a.order - b.order)
    .forEach(visit);
  if (path.length < lessons.length) {
    const reached = new Set(path.map((l) => l.id));
    const lost = lessons.filter((l) => !reached.has(l.id)).map((l) => l.id);
    throw new Error(`lessons never reached: ${lost.join(', ')}`);
  }
  return path;
}
