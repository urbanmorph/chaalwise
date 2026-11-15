import type { GradedStep, Step } from '@chaalwise/core/lesson';
import { isGraded } from '@chaalwise/core/player';
import { toFen, toSan } from './chess';
import { ideaOf, type LabIndex, type LabRef } from './labs/lab-ref';

/**
 * Meet the game first: a question about a game is asked only once the learner
 * has played it a little. A game is met through what is done on this device:
 * chess by any chess lesson (the first moves, or a check passed), poker by its
 * guided hands, a lab by playing it. Questions about life off the board need nothing.
 */

/** Where a question comes from: its game, and its lab if it is a lab's. `labs` holds the labs its idea may be met in (labIndex in labs.ts). */
export function sourceOf(cardId: string, step: GradedStep, labs: LabIndex): { game?: string; lab?: LabRef } {
  const idea = ideaOf(cardId);
  const game = idea.split('/')[0];
  if (game === 'chess' || game === 'poker') return { game };
  const lab = labs[idea];
  if (lab) return { game: 'labs', lab };
  if (game === 'labs') return { game: 'labs' };
  return step.position || step.kind === 'move' ? { game: 'chess' } : {};
}

/** The game a question needs met first: `chess`, `poker`, `labs/<slug>`, or nothing. */
export function needs(cardId: string, step: GradedStep, labs: LabIndex): string | undefined {
  const { game, lab } = sourceOf(cardId, step, labs);
  return lab ? `labs/${lab.slug}` : game === 'labs' ? undefined : game;
}

/** The games met, from the lessons and labs done on this device. */
export const gamesMet = (done: ReadonlySet<string>): Set<string> =>
  new Set(
    [...done].flatMap((id) =>
      id.startsWith('chess/') ? ['chess'] : id.startsWith('poker/') ? ['poker'] : id.startsWith('labs/') ? [id] : [],
    ),
  );

export const askable = (cardId: string, step: GradedStep, met: ReadonlySet<string>, labs: LabIndex): boolean => {
  const game = needs(cardId, step, labs);
  return !game || met.has(game);
};

/**
 * The games whose questions a strategy lesson shows as worked examples until
 * the learner has met them: chess, poker, and the lab the lesson follows.
 * Game lessons are the way in, so they ask every question.
 */
export function meetFirst(
  lesson: { game: string; after?: string | undefined },
  steps: readonly Step[],
  labs: LabIndex,
): string[] {
  if (lesson.game !== 'strategy') return [];
  const games = steps.filter(isGraded).map((s) => needs(s.id, s, labs));
  return [...new Set(games)].filter((g): g is string => g === 'chess' || g === 'poker' || g === lesson.after);
}

/** A lesson's steps as the learner sees them: a question about a game in `games` not yet met is a worked example. */
export const asMet = (
  steps: readonly Step[],
  games: readonly string[],
  met: ReadonlySet<string>,
  labs: LabIndex,
): Step[] =>
  steps.map((s) => {
    if (!isGraded(s)) return s;
    const game = needs(s.id, s, labs);
    return game && games.includes(game) && !met.has(game) ? workedExample(s) : s;
  });

/** Where the case beside a comparison sits: away from the poker table, the lab or the chessboard its game moment is on. */
export const awayFrom = (step: Extract<GradedStep, { kind: 'choice' }>): string =>
  step.cards ? 'Away from the table' : step.lab ? 'Away from the lab' : 'Off the board';

/**
 * A question shown as a worked example, for a learner who has not met its
 * game: the board or cards, the answer and why, to read rather than to guess
 * (worked examples help newcomers most: the expertise reversal effect).
 */
export function workedExample(step: GradedStep): Extract<Step, { kind: 'read' }> {
  const board = { kind: 'read' as const, id: step.id, position: step.position };
  if (step.kind === 'move') {
    const move = step.answers[0]!;
    const san = toSan(toFen(step.position), move);
    return {
      ...board,
      text: `Worked example. ${step.prompt} The move is ${san}. ${step.explanation}`,
      arrows: [move.slice(0, 4)],
    };
  }
  if (step.kind === 'choice') {
    const beside = step.alongside ? `${awayFrom(step)}: ${step.alongside} ` : '';
    return {
      ...board,
      text: `Worked example. ${beside}${step.prompt} The answer: “${step.options[step.answer]}”. ${step.explanation}`,
      highlight: step.highlight,
      arrows: step.arrows,
      cards: step.cards,
    };
  }
  return { ...board, text: `Worked example. ${step.prompt} ${step.explanation}` };
}
