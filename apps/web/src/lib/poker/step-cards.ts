import type { Step } from '@chaalwise/core/lesson';

/** The cards a poker step shows: your hand, the shared cards, others' hands, the pot and what a call costs. */
export type StepCards = NonNullable<Extract<Step, { kind: 'read' }>['cards']>;

/** What is wrong with a step's cards: a card dealt twice, or shared cards that no hand could show. */
export function cardIssues(cards: StepCards): { path: (string | number)[]; message: string }[] {
  const dealt = [...(cards.hole ?? []), ...(cards.board ?? []), ...(cards.others ?? []).flatMap((o) => o.cards)];
  const twice = [...new Set(dealt.filter((card, i) => dealt.indexOf(card) !== i))];
  const board = cards.board?.length ?? 0;
  return [
    ...twice.map((card) => ({ path: ['cards'], message: `${card} is dealt twice` })),
    ...(board === 1 || board === 2
      ? [{ path: ['cards', 'board'], message: 'the shared cards are none, three, four or five' }]
      : []),
  ];
}
