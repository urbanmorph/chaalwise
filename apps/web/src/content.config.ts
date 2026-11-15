import { laterCaseSchema, lessonSchema, questionId, questionSchema } from '@chaalwise/core/lesson';
import { referenceSchema } from '@chaalwise/core/reference';
import { trackSchema } from '@chaalwise/core/track';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { defineCollection } from 'astro:content';
import { chessLessonIssues, parseMoveText, positionFromMoves, questionIssues } from './lib/chess';
import { cardIssues } from './lib/poker/step-cards';
import { referenceIssues } from './lib/reference';

/** Lessons are Markdown with their steps as data. A broken lesson fails the build. */
const lessons = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/lessons' }),
  schema: lessonSchema.superRefine((lesson, ctx) => {
    for (const issue of chessLessonIssues(lesson)) ctx.addIssue({ code: 'custom', ...issue });
    lesson.steps.forEach((step, i) => {
      if ('cards' in step && step.cards)
        for (const issue of cardIssues(step.cards))
          ctx.addIssue({ code: 'custom', ...issue, path: ['steps', i, ...issue.path] });
    });
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

/** Each strategy track as a course: one Markdown file per track, named by its id. */
const tracks = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/tracks' }),
  schema: trackSchema,
});

/** The question corpus: one YAML file per question, at `<game>/<idea>/<name>.yaml`. A broken question fails the build. */
const questions = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/questions' }),
  schema: questionSchema.superRefine((question, ctx) => {
    for (const issue of questionIssues(question)) ctx.addIssue({ code: 'custom', ...issue });
    if ('cards' in question && question.cards)
      for (const issue of cardIssues(question.cards)) ctx.addIssue({ code: 'custom', ...issue });
  }),
});

const slug = z.string().regex(/^[a-z0-9-]+$/, 'a strategy lesson, by its file name');

/**
 * "Which idea fits?" situations: one file each, at `<idea>/<name>.yaml`, where `<idea>` is the strategy lesson whose
 * idea the situation calls for. The keys match a question's, so the prose checks read them the same way.
 */
const fits = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/fits' }),
  schema: z
    .object({
      /** The life question the situation was written from, if any. */
      from: questionId.optional(),
      /** The situation, naming no idea. */
      prompt: z.string().min(1),
      /** Why the idea fits. */
      explanation: z.string().min(1),
      /** Look-alike ideas, by lesson file name, each with why it does not fit here. */
      feedback: z
        .record(slug, z.string().min(1))
        .refine((n) => Object.keys(n).length >= 2, 'name two near misses or more'),
      /** Ideas that fit as well, never offered as wrong answers. */
      alsoFits: z.array(slug).optional(),
      /** The look-alike situation that calls for another idea, as `<idea>/<name>`. */
      pair: z
        .string()
        .regex(/^[a-z0-9-]+\/[a-z0-9-]+$/)
        .optional(),
    })
    .strict(),
});

/** Cases a week later: one Markdown file each, its decisions in the corpus under `later/<case>/`. */
const later = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/later' }),
  schema: laterCaseSchema.superRefine((c, ctx) =>
    c.steps.forEach((step, i) => {
      if ('ask' in step && !step.ask.startsWith('later/'))
        ctx.addIssue({
          code: 'custom',
          message: 'a case a week later asks only its own, unseen decisions',
          path: ['steps', i],
        });
    }),
  ),
});

export const collections = { lessons, safetyDrills, reference, tracks, questions, fits, later };
