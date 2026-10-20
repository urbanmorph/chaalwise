import type { HandValue } from '@chaalwise/poker/evaluate';
import { betSize, toCall, type Move, type Table } from '@chaalwise/poker/table';

/** The words the poker table uses: points, moves and how a hand ended. Practice points only, never chips or money. */

/** A number of practice points, in words: "1 point", "12 points". */
export const pointsWord = (n: number) => `${n} ${n === 1 ? 'point' : 'points'}`;

/** A move as its button says it, with what it costs: "Call 2", "Raise, 4 points". */
export const moveLabel = (table: Table, move: Move) =>
  move === 'call'
    ? `Call ${toCall(table)}`
    : move === 'bet'
      ? `Bet ${betSize(table.street)}`
      : move === 'raise'
        ? `Raise, ${toCall(table) + betSize(table.street)} points`
        : move === 'fold'
          ? 'Fold'
          : 'Check';

/** How a finished heads-up hand ended, for the learner in seat `you` against the bot in seat `bot`. */
export function resultText(table: Table, you: number, bot: number): string {
  const r = table.result!;
  const won = r.winners.includes(you);
  if (r.byFold)
    return won
      ? `The bot folded. You win the pot of ${pointsWord(r.won)}.`
      : `You folded. The bot wins the pot of ${pointsWord(r.won)}.`;
  // At a showdown, both hands are known.
  const yours: HandValue = r.hands[you]!;
  const theirs: HandValue = r.hands[bot]!;
  if (r.winners.length > 1) return `A split pot: you both have ${yours.name}.`;
  return won
    ? `You win ${pointsWord(r.won)} with ${yours.name}. The bot had ${theirs.name}.`
    : `The bot wins ${pointsWord(r.won)} with ${theirs.name}. You had ${yours.name}.`;
}
