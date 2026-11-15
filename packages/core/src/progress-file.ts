import { z } from 'zod';
import { JUDGEMENTS } from './journal';
import { CHECK_IN_RESULTS } from './plans';
import { State } from './srs';

/** The progress export file. Checked strictly on import: it replaces everything on the device. */

const outcome = z.enum(['first-try', 'with-help', 'missed']);
const date = z.coerce.date();
export const exportSchema = z.object({
  app: z.literal('chaalwise'),
  version: z.literal(1),
  exportedAt: date,
  lessons: z.array(
    z.object({
      lessonId: z.string(),
      completedAt: date,
      times: z.number().int().positive(),
      outcomes: z.record(z.string(), outcome),
    }),
  ),
  // Added in October 2026; files exported before then have none.
  attempts: z
    .array(
      z.object({
        skill: z.string(),
        outcome,
        at: date,
        source: z.enum(['lesson', 'review', 'practice', 'drill']),
        // Added with the stricter levels; earlier files have neither.
        item: z.string().optional(),
        chance: z.number().min(0).max(1).optional(),
        confidence: z.number().min(0).max(1).optional(),
      }),
    )
    .default([]),
  // Added with plans in October 2026; earlier files have none.
  plans: z
    .array(
      z.object({
        id: z.string(),
        track: z.string(),
        text: z.string(),
        createdAt: date,
        checkIns: z.array(z.object({ at: date, result: z.enum(CHECK_IN_RESULTS) })),
      }),
    )
    .default([]),
  // Added with the decision journal in November 2026; earlier files have none.
  journal: z
    .array(
      z.discriminatedUnion('kind', [
        z.object({
          id: z.string(),
          kind: z.literal('decision'),
          createdAt: date,
          deciding: z.string(),
          expect: z.string(),
          sure: z.number().min(0).max(100),
          lookBackOn: date,
          lookedBack: z.object({ at: date, happened: z.string(), judged: z.enum(JUDGEMENTS) }).optional(),
        }),
        z.object({
          id: z.string(),
          kind: z.literal('reflection'),
          createdAt: date,
          from: z.string(),
          title: z.string(),
          same: z.string(),
          change: z.string(),
        }),
      ]),
    )
    .default([]),
  drills: z
    .array(
      z.object({
        drillId: z.string(),
        best: z.number(),
        last: z.number(),
        times: z.number().int().positive(),
        lastAt: date,
      }),
    )
    .default([]),
  cards: z.array(
    z.object({
      id: z.string(),
      card: z.object({
        due: date,
        stability: z.number(),
        difficulty: z.number(),
        elapsed_days: z.number(),
        scheduled_days: z.number(),
        learning_steps: z.number(),
        reps: z.number(),
        lapses: z.number(),
        state: z.enum(State),
        last_review: date.optional(),
      }),
    }),
  ),
});
export type ProgressExport = z.infer<typeof exportSchema>;
