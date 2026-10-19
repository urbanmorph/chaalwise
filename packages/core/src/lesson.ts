import { z } from 'zod';
import { SKILL_IDS } from './skills';

/**
 * The lesson format, stored as data. It is game-neutral: a position and its
 * answers are opaque strings here, and each game checks its own (the chess
 * section validates them with chessops at build time).
 */

const stepId = z.string().regex(/^[a-z0-9-]+$/, 'step ids are lowercase words joined by hyphens');

const readStep = z.object({ kind: z.literal('read'), id: stepId, text: z.string().min(1) });

const choiceStep = z
  .object({
    kind: z.literal('choice'),
    id: stepId,
    prompt: z.string().min(1),
    position: z.string().optional(),
    options: z.array(z.string().min(1)).min(2),
    answer: z.number().int().nonnegative(),
    hint: z.string().optional(),
    explanation: z.string().min(1),
  })
  .refine((s) => s.answer < s.options.length, {
    message: 'answer must be the index of one of the options',
    path: ['answer'],
  });

const moveStep = z.object({
  kind: z.literal('move'),
  id: stepId,
  prompt: z.string().min(1),
  position: z.string().min(1),
  /** Every move accepted as correct; the first is the one shown when revealed. */
  answers: z.array(z.string().min(1)).min(1),
  orientation: z.enum(['white', 'black']).optional(),
  hint: z.string().optional(),
  explanation: z.string().min(1),
});

/** Pick a square on the board, e.g. coordinates drills. Answers are square names. */
const squareStep = z.object({
  kind: z.literal('square'),
  id: stepId,
  prompt: z.string().min(1),
  position: z.string().optional(),
  answers: z.array(z.string().regex(/^[a-h][1-8]$/, 'a square such as e4')).min(1),
  orientation: z.enum(['white', 'black']).optional(),
  hint: z.string().optional(),
  explanation: z.string().min(1),
});

/** Play the position out against the computer until the goal is reached, e.g. a basic mate. */
const playStep = z.object({
  kind: z.literal('play'),
  id: stepId,
  prompt: z.string().min(1),
  position: z.string().min(1),
  goal: z.literal('checkmate'),
  /** The most moves the learner may take. */
  within: z.number().int().positive(),
  opponent: z.literal('lone-king'),
  orientation: z.enum(['white', 'black']).optional(),
  hint: z.string().optional(),
  explanation: z.string().min(1),
});

export const stepSchema = z.discriminatedUnion('kind', [readStep, choiceStep, moveStep, squareStep, playStep]);

export const lessonSchema = z
  .object({
    title: z.string().min(1),
    summary: z.string().min(1),
    game: z.enum(['chess']),
    stage: z.number().int().nonnegative(),
    order: z.number().int().nonnegative(),
    skills: z.array(z.enum(SKILL_IDS)),
    steps: z.array(stepSchema).min(1),
  })
  .superRefine((lesson, ctx) => {
    const seen = new Set<string>();
    lesson.steps.forEach((step, i) => {
      if (seen.has(step.id)) {
        ctx.addIssue({
          code: 'custom',
          message: `duplicate step id "${step.id}"`,
          path: ['steps', i, 'id'],
        });
      }
      seen.add(step.id);
    });
  });

export type Lesson = z.infer<typeof lessonSchema>;
export type Step = z.infer<typeof stepSchema>;
export type GradedStep = Exclude<Step, { kind: 'read' }>;
