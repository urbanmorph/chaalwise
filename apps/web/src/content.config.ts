import { lessonSchema } from '@chaalwise/core/lesson';
import { referenceSchema } from '@chaalwise/core/reference';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { defineCollection } from 'astro:content';
import { chessLessonIssues, parseMoveText, positionFromMoves } from './lib/chess';
import { referenceIssues } from './lib/reference';

/** Lessons are Markdown with their steps as data. A broken lesson fails the build. */
const lessons = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/lessons' }),
  schema: lessonSchema.superRefine((lesson, ctx) => {
    for (const issue of chessLessonIssues(lesson)) ctx.addIssue({ code: 'custom', ...issue });
  }),
});

/**
 * "Is this move safe?" drill positions: a game so far (or a FEN) and a candidate
 * move. The answer is not written here; the teaching helpers work it out at build time.
 */
const safetyDrills = defineCollection({
  loader: file('src/content/drills/safety.json'),
  schema: z
    .object({ moves: z.string().optional(), fen: z.string().optional(), move: z.string(), note: z.string().optional() })
    .refine((d) => !!d.moves !== !!d.fen, 'give either moves or fen')
    .superRefine((d, ctx) => {
      try {
        const fen = d.fen ?? positionFromMoves(d.moves!);
        if (!parseMoveText(fen, d.move))
          ctx.addIssue({ code: 'custom', message: `${d.move} is not a legal move here`, path: ['move'] });
      } catch (error) {
        ctx.addIssue({ code: 'custom', message: String(error), path: [d.fen ? 'fen' : 'moves'] });
      }
    }),
});

/** The reference: one Markdown file per entry, by game. A wrong diagram fails the build. */
const reference = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/reference' }),
  schema: referenceSchema.superRefine((entry, ctx) => {
    for (const issue of referenceIssues(entry)) ctx.addIssue({ code: 'custom', ...issue });
  }),
});

export const collections = { lessons, safetyDrills, reference };
