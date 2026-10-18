import { lessonSchema } from '@chaalwise/core/lesson';
import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { chessLessonIssues } from './lib/chess';

/** Lessons are Markdown with their steps as data. A broken lesson fails the build. */
const lessons = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/lessons' }),
  schema: lessonSchema.superRefine((lesson, ctx) => {
    for (const issue of chessLessonIssues(lesson)) ctx.addIssue({ code: 'custom', ...issue });
  }),
});

export const collections = { lessons };
