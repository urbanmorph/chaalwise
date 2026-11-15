import type { Step } from '@chaalwise/core/lesson';
import { getCollection } from 'astro:content';
import { LABS, labHref } from './labs/labs';
import { allLessons, lessonHref } from './lessons';
import { ask } from './questions';

/** A case a week later as review plays it: its steps, and the idea it tests, named only once it is done. */
export interface LaterCaseData {
  id: string;
  title: string;
  /** The lesson or lab, as `strategy/blunder-check` or `labs/split-the-pie`. */
  idea: string;
  ideaTitle: string;
  href: string;
  steps: Step[];
}

/** Every case a week later. One whose idea is not a lesson or lab on the site fails the build. */
export async function laterCases(): Promise<LaterCaseData[]> {
  const lessons = new Map((await allLessons()).map((l) => [l.id, l]));
  return Promise.all(
    (await getCollection('later')).map(async ({ id, data }) => {
      const lesson = lessons.get(data.idea);
      const lab = LABS.find((l) => `labs/${l.slug}` === data.idea);
      if (!lesson && !lab) throw new Error(`later/${id}: no lesson or lab ${data.idea}`);
      const steps = await Promise.all(data.steps.map(async (s) => ('ask' in s ? (await ask([s.ask]))[0]! : s)));
      return {
        id: `later/${id}`,
        title: data.title,
        idea: data.idea,
        ideaTitle: lesson?.data.title ?? lab!.title,
        href: lesson ? lessonHref(lesson) : labHref(lab!),
        steps,
      };
    }),
  );
}
