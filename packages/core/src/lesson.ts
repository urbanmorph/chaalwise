import { z } from 'zod';
import { SKILL_IDS } from './skills';

/**
 * The lesson format, stored as data. It is game-neutral: a position and its
 * answers are opaque strings here, and each game checks its own (the chess
 * section validates them with chessops at build time).
 */

const stepId = z.string().regex(/^[a-z0-9-]+$/, 'step ids are lowercase words joined by hyphens');

/** A generator that makes fresh positions of this step's idea for review and practice (see the web app's practice kinds). */
const practice = z
  .string()
  .regex(/^[a-z-]+$/)
  .optional();

/** The profile skill this step's answers give evidence for (overrides the lesson's). Checked against the game's skill list. */
const measures = z
  .string()
  .regex(/^[a-z-]+$/)
  .optional();

const squareName = z.string().regex(/^[a-h][1-8]$/, 'a square such as e4');

/** Text to read, optionally beside a board with squares picked out (e.g. a file or a rank). */
const readStep = z.object({
  kind: z.literal('read'),
  id: stepId,
  text: z.string().min(1),
  position: z.string().optional(),
  orientation: z.enum(['white', 'black']).optional(),
  highlight: z.array(squareName).optional(),
});

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
    measures,
    /** Squares to highlight on the board once the answer is shown, e.g. the square the question is about. */
    highlight: z.array(squareName).optional(),
    /** Arrows to draw once the answer is shown, as from-to pairs such as c3d1 (a knight's arrow turns the corner). */
    arrows: z.array(z.string().regex(/^[a-h][1-8][a-h][1-8]$/, 'an arrow such as c3d1')).optional(),
    /** Why each option fails, in the same order as the options, shown when it is picked; the right option's line is empty. */
    feedback: z.array(z.string()).optional(),
    /** A case off the board shown beside the board, to compare the two: what do they share? */
    alongside: z.string().min(1).optional(),
  })
  .refine((s) => s.answer < s.options.length, {
    message: 'answer must be the index of one of the options',
    path: ['answer'],
  })
  .refine((s) => !s.alongside || s.position, {
    message: 'a step with a case alongside needs a board to compare it with',
    path: ['alongside'],
  })
  .refine(
    (s) =>
      !s.feedback || (s.feedback.length === s.options.length && s.feedback.every((line, i) => i === s.answer || line)),
    {
      message: 'feedback needs one line per option, and a reason for every wrong one',
      path: ['feedback'],
    },
  );

const moveStep = z.object({
  kind: z.literal('move'),
  id: stepId,
  prompt: z.string().min(1),
  position: z.string().min(1),
  practice,
  measures,
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
  answers: z.array(squareName).min(1),
  orientation: z.enum(['white', 'black']).optional(),
  practice,
  measures,
  /** Show the letters and numbers on the edges (off by default, since they give the answer away). */
  coordinates: z.boolean().optional(),
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
  practice,
  measures,
  /** The most moves the learner may take. */
  within: z.number().int().positive(),
  opponent: z.literal('lone-king'),
  orientation: z.enum(['white', 'black']).optional(),
  hint: z.string().optional(),
  explanation: z.string().min(1),
});

/**
 * A plan to use the idea away from the board, not graded: the learner picks the
 * situation (or writes their own), and the action completes "When …, …".
 */
const planStep = z.object({
  kind: z.literal('plan'),
  id: stepId,
  prompt: z.string().min(1),
  /** Each completes "When …", such as "I am about to send an important email". */
  situations: z.array(z.string().min(1)).min(2),
  /** Completes the sentence, such as "I will ask what it lets the other side do". */
  action: z.string().min(1),
});

/** A step as played: reading, a question looked up from the corpus, or a plan. */
export const stepSchema = z.discriminatedUnion('kind', [
  readStep,
  choiceStep,
  moveStep,
  squareStep,
  playStep,
  planStep,
]);

/** A question in the corpus, named by its file: `<game>/<idea>/<name>`, such as `chess/fork/knight-takes-two`. */
export const questionId = z
  .string()
  .regex(/^[a-z]+\/[a-z0-9-]+\/[a-z0-9-]+$/, 'a question id such as chess/fork/knight-takes-two');

/**
 * A question in the corpus: one file each, in any of the question formats. Its
 * id is its file's path; `card` keeps the review card it was saved under
 * before the corpus existed, so learners' progress carries over.
 */
export const questionSchema = z.intersection(
  z.preprocess(
    (value) => (value && typeof value === 'object' ? { ...value, id: 'question' } : value),
    z.discriminatedUnion('kind', [choiceStep, moveStep, squareStep, playStep]),
  ),
  z.object({ card: z.string().min(1).optional() }),
);
export type Question = z.infer<typeof questionSchema>;

/** A lesson step that asks a question from the corpus. */
const askStep = z.object({ ask: questionId }).strict();

/** A lesson step as written: reading and plans in the lesson, questions asked from the corpus. */
const authoredStep = z.union([z.discriminatedUnion('kind', [readStep, planStep]), askStep]);

export const lessonSchema = z
  .object({
    title: z.string().min(1),
    summary: z.string().min(1),
    /** `strategy` lessons teach a skill off the board, between the game lessons that ground it. */
    game: z.enum(['chess', 'strategy']),
    stage: z.number().int().nonnegative(),
    order: z.number().int().nonnegative(),
    skills: z.array(z.enum(SKILL_IDS)),
    /** For a strategy lesson: the lesson it follows on the path, e.g. `chess/blunder-check`. */
    after: z.string().optional(),
    steps: z.array(authoredStep).min(1),
  })
  .superRefine((lesson, ctx) => {
    if (lesson.game === 'strategy') {
      if (!lesson.after)
        ctx.addIssue({
          code: 'custom',
          message: 'a strategy lesson must say which lesson it comes after',
          path: ['after'],
        });
      if (!lesson.skills.length)
        ctx.addIssue({ code: 'custom', message: 'a strategy lesson must name the skill it trains', path: ['skills'] });
    }
    const seen = new Set<string>();
    lesson.steps.forEach((step, i) => {
      const key = 'ask' in step ? step.ask : step.id;
      if (seen.has(key)) ctx.addIssue({ code: 'custom', message: `duplicate step "${key}"`, path: ['steps', i] });
      seen.add(key);
    });
  });

export type Lesson = z.infer<typeof lessonSchema>;
export type Step = z.infer<typeof stepSchema>;
export type GradedStep = Exclude<Step, { kind: 'read' } | { kind: 'plan' }>;
