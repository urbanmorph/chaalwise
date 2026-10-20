import { z } from 'zod';

/**
 * A strategy track as a course (plan, section 1): the idea, why it matters, an
 * example at work and one in study, and the one question that turns it into a
 * habit. The lessons, practice and review come from the lessons that train it.
 */
export const trackSchema = z.object({
  idea: z.string().min(1),
  why: z.string().min(1),
  atWork: z.string().min(1),
  inStudy: z.string().min(1),
  habit: z.string().regex(/\?$/, 'the habit is a question to ask yourself'),
});

export type TrackCourse = z.infer<typeof trackSchema>;
