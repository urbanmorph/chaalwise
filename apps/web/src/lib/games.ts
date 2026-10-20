import type { GradedStep, Step } from '@chaalwise/core/lesson';
import { toFen, toSan } from './chess';
import { LABS, type Lab } from './labs/labs';

/**
 * Meet the game first: a question about a game is asked only once the learner
 * has played it a little. A game is met through what is done on this device:
 * chess by any chess lesson (the first moves, or a check passed), poker by its
 * guided hands, a lab by playing it. Questions about life off the board need nothing.
 */

/** Where a question comes from: its game, and its lab if it is a lab's. */
export function sourceOf(cardId: string, step: GradedStep): { game?: string; lab?: Lab } {
  // Cards saved before the corpus began are `reference/<game>/<entry>/<name>`; corpus ids are `<game>/<idea>/<name>`.
  const parts = cardId.split('/');
  const [game, idea] = parts[0] === 'reference' ? parts.slice(1) : parts;
  if (game === 'chess' || game === 'poker') return { game };
  const lab = LABS.find((l) => l.entry === `${game}/${idea}` || (game === 'labs' && l.slug === idea));
  if (lab) return { game: 'labs', lab };
  if (game === 'labs') return { game: 'labs' };
  return step.position || step.kind === 'move' ? { game: 'chess' } : {};
}

/** The game a question needs met first: `chess`, `poker`, `labs/<slug>`, or nothing. */
export function needs(cardId: string, step: GradedStep): string | undefined {
  const { game, lab } = sourceOf(cardId, step);
  return lab ? `labs/${lab.slug}` : game === 'labs' ? undefined : game;
}

/** The games met, from the lessons and labs done on this device. */
export const gamesMet = (done: ReadonlySet<string>): Set<string> =>
  new Set(
    [...done].flatMap((id) =>
      id.startsWith('chess/') ? ['chess'] : id.startsWith('poker/') ? ['poker'] : id.startsWith('labs/') ? [id] : [],
    ),
  );

export const askable = (cardId: string, step: GradedStep, met: ReadonlySet<string>): boolean => {
  const game = needs(cardId, step);
  return !game || met.has(game);
};

/**
 * A board question shown as a worked example, for a learner who has not met
 * chess: the position, the answer and why, to read rather than to guess
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
    const beside = step.alongside ? `Off the board: ${step.alongside} ` : '';
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
