import type { GradedStep } from '@chaalwise/core/lesson';
import { LABS } from './labs/labs';
import { isPracticeKind } from './practice-kinds';
import { trackOf } from './profile-skills';
import { shuffle } from './random';

/** A question in a round, with the review card it counts towards and where it comes from. */
export type RoundItem = { cardId: string; step: GradedStep; context?: string | undefined };

/** The practice a step names, if its kind can have one. */
export const practiceOf = (step: GradedStep) => ('practice' in step ? step.practice : undefined);

/**
 * The questions for a review or practice round. A question that names a
 * practice comes back as a fresh position of the same idea; the generators load
 * only when a round needs them.
 */
export async function roundItems(ids: string[], steps: Record<string, GradedStep>): Promise<RoundItem[]> {
  const needsPractice = ids.some((id) => practiceOf(steps[id]!));
  const { practiceStep } = needsPractice ? await import('./practice') : { practiceStep: undefined };
  return ids.map((cardId) => {
    const step = steps[cardId]!;
    const kind = practiceOf(step);
    const fresh =
      kind && isPracticeKind(kind) && practiceStep
        ? { ...practiceStep(kind, Math.random), measures: step.measures }
        : step;
    return { cardId, step: fresh, context: contextOf(cardId, step) };
  });
}

/**
 * A mixed round: questions dealt from each strategy track in turn, so the
 * learner has to work out which idea each one calls for (interleaving helps
 * most when the ideas are easily confused). Questions that train no track,
 * such as board sense, are left out.
 */
export function mixedIds(steps: Record<string, GradedStep>, count: number, random: () => number): string[] {
  const byTrack = new Map<string, string[]>();
  for (const [id, step] of Object.entries(steps)) {
    const track = trackOf(step.measures);
    if (track) byTrack.set(track, [...(byTrack.get(track) ?? []), id]);
  }
  const piles = shuffle([...byTrack.values()], random).map((ids) => shuffle(ids, random));
  const ids: string[] = [];
  while (ids.length < count && piles.some((p) => p.length))
    for (const pile of piles) if (pile.length && ids.length < count) ids.push(pile.pop()!);
  return ids;
}

const GAMES: Record<string, string> = { chess: 'In chess', poker: 'In poker' };

/**
 * Where a question comes from, for rounds that mix questions from many lessons:
 * the game for game questions, the lab for its debrief, chess for a strategy
 * question set on a board, and nothing for one about life off the board.
 */
export function contextOf(cardId: string, step: GradedStep): string | undefined {
  // Cards saved before the corpus began are `reference/<game>/<entry>/<name>`; corpus ids are `<game>/<idea>/<name>`.
  const parts = cardId.split('/');
  const [game, idea] = parts[0] === 'reference' ? parts.slice(1) : parts;
  if (GAMES[game!]) return GAMES[game!];
  const lab = LABS.find((l) => l.entry === `${game}/${idea}` || (game === 'labs' && l.slug === idea));
  if (lab) return `In the ${lab.title} lab`;
  if (game === 'labs') return 'In game theory';
  return step.position || step.kind === 'move' ? 'In chess' : undefined;
}
