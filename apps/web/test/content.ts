import type { Lesson, Step } from '@chaalwise/core/lesson';
import { readdirSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';

/**
 * Content as the site shows it, for tests that check what lessons and entries
 * claim: each lesson's questions looked up in the corpus, with the short ids the
 * lesson knew them by.
 */
const CONTENT = new URL('../src/content/', import.meta.url);

/** Every question in the corpus, by id (`<game>/<idea>/<name>`). */
export const corpus = new Map(
  readdirSync(new URL('questions/', CONTENT), { recursive: true })
    .map(String)
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => [
      f.replace('.yaml', ''),
      parse(readFileSync(new URL(`questions/${f}`, CONTENT), 'utf8')) as Record<string, unknown>,
    ]),
);

/** A question as a step: its short name as id. */
export const question = (id: string) => {
  const data = corpus.get(id);
  if (!data) throw new Error(`no question ${id}`);
  const step: Record<string, unknown> = { ...data, id: id.split('/').pop()! };
  delete step.card;
  return step as unknown as Step;
};

/** A content file's front matter, by its path under `src/content/`. */
export const frontmatter = (path: string) => parse(readFileSync(new URL(path, CONTENT), 'utf8').split(/^---$/m)[1]!);

/** The lessons in a folder (`chess`, `strategy` or `cases`), each with its questions looked up. */
export const lessonsIn = (folder: string) =>
  readdirSync(new URL(`lessons/${folder}/`, CONTENT)).map((file) => {
    const data = frontmatter(`lessons/${folder}/${file}`) as Lesson;
    const steps = data.steps.map((step) => ('ask' in step ? question(step.ask) : step)) as Step[];
    return { file, data: { ...data, steps } };
  });

/** Whether a lesson shows a chessboard in any step. */
export const showsChess = ({ data }: { data: { steps: Step[] } }) =>
  data.steps.some((s) => 'position' in s && s.position);

/** The reference entries in a folder, each with its try-it questions looked up. */
export const entriesIn = (game: string) =>
  readdirSync(new URL(`reference/${game}/`, CONTENT)).map((file) => {
    const data = frontmatter(`reference/${game}/${file}`) as { try?: string[] };
    return { file, data, questions: (data.try ?? []).map(question) };
  });

/** Every question id that a lesson, a reference entry or a case a week later asks. */
export const askedIds = (): string[] => [
  ...['chess', 'strategy', 'cases'].flatMap((folder) =>
    readdirSync(new URL(`lessons/${folder}/`, CONTENT)).flatMap((file) =>
      (frontmatter(`lessons/${folder}/${file}`) as Lesson).steps.flatMap((step) => ('ask' in step ? [step.ask] : [])),
    ),
  ),
  ...['strategy', 'chess', 'poker', 'labs'].flatMap((game) => entriesIn(game).flatMap(({ data }) => data.try ?? [])),
  ...readdirSync(new URL('later/', CONTENT)).flatMap((file) =>
    (frontmatter(`later/${file}`) as Lesson).steps.flatMap((step) => ('ask' in step ? [step.ask] : [])),
  ),
];

/**
 * Terms that belong to one game or sport, with little everyday meaning of their own.
 * A question about life that uses one must say which game it means: mixed practice
 * and review show it alone, with no lesson around it to say so.
 */
export const GAMES: [name: RegExp, terms: RegExp][] = [
  [
    /\bchess\b/i,
    /\b(knight|bishop|rook|pawn|checkmate|stalemate|castling|en passant|back rank|sicilian|recapture)s?\b/i,
  ],
  [/\bpoker\b/i, /\b(the flop|river card|turn card|big blind|pot odds|check-raise|hole cards|all-in)\b/i],
  [/\b(football|soccer)\b/i, /\b(penalty kick|penalty taker|goalkeeper|offside|free kick|corner kick)s?\b/i],
  [/\bcricket\b/i, /\b(wicket|innings|bowler|batsman|lbw)s?\b/i],
  [/\btennis\b/i, /\b(deuce|double fault|tiebreak|break point)s?\b/i],
  [/\bgolf\b/i, /\b(birdie|bogey|putt)s?\b/i],
  [/\bbasketball\b/i, /\b(free throw|three-pointer)s?\b/i],
];
