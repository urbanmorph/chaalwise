import { z } from 'zod';
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
