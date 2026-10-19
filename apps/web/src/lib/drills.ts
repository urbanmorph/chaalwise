import { capturedPiece, fromFen, legal, play } from '@chaalwise/teach/position';
import { moveSafety } from '@chaalwise/teach/safety';
import { makeSan } from 'chessops/san';
import type { Chess } from 'chessops/chess';

const FILES = 'abcdefgh';

/** A random square, never the previous one. `random` returns [0, 1), so tests can seed it. */
export function randomSquare(random: () => number, previous?: string): string {
  for (;;) {
    const square = FILES[Math.floor(random() * 8)]! + (Math.floor(random() * 8) + 1);
    if (square !== previous) return square;
  }
}

const count = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;

/** After a wrong pick: which way the target is, as the learner sees the board. */
export function coordinateHint(target: string, picked: string, orientation: 'white' | 'black'): string {
  const flip = orientation === 'white' ? 1 : -1;
  const files = (FILES.indexOf(target[0]!) - FILES.indexOf(picked[0]!)) * flip;
  const ranks = (Number(target[1]) - Number(picked[1])) * flip;
  const parts = [
    files && `${count(Math.abs(files), 'file')} to the ${files > 0 ? 'right' : 'left'}`,
    ranks && `${count(Math.abs(ranks), 'rank')} ${ranks > 0 ? 'up' : 'down'}`,
  ].filter(Boolean);
  const [first, second] = parts;
  if (second) return `${target} is ${first} and ${second} from ${picked}.`;
  return `${target} is ${first} ${files ? 'of' : 'from'} ${picked}.`;
}

const ordinal = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`;

/** A hint after a wrong square: which file or rank it was on, or which way to look for a single square. */
export function squareHint(answers: string[], picked: string, orientation: 'white' | 'black'): string | undefined {
  if (answers.length === 1) return coordinateHint(answers[0]!, picked, orientation);
  const files = new Set(answers.map((a) => a[0]));
  const ranks = new Set(answers.map((a) => a[1]));
  if (files.size === 1) return `${picked} is on the ${picked[0]}-file. Look for the ${answers[0]![0]}-file.`;
  if (ranks.size === 1)
    return `${picked} is on the ${ordinal(Number(picked[1]))} rank. Look for the ${ordinal(Number(answers[0]![1]))} rank.`;
  return undefined;
}

const san = (pos: Chess, uci: string) => makeSan(pos, legal(pos, uci)!);

/** The answer to "is this move safe?", worded from the teaching helpers' count, with an optional note from the drill. */
export function safetyVerdict(fen: string, uci: string, note?: string): { safe: boolean; text: string } {
  const verdict = plainVerdict(fen, uci);
  return note ? { ...verdict, text: `${verdict.text} ${note}` } : verdict;
}

function plainVerdict(fen: string, uci: string): { safe: boolean; text: string } {
  const pos = fromFen(fen);
  const result = moveSafety(pos, uci);
  const move = san(pos, uci);
  if (result.allowsMate) {
    return { safe: false, text: `Not safe. After ${move}, they mate with ${san(play(pos, uci), result.allowsMate)}.` };
  }
  const [worst] = result.losses;
  if (!result.safe && worst)
    return { safe: false, text: `Not safe. After ${move}, they can win your ${worst.role} on ${worst.name}.` };
  const captured = capturedPiece(pos, legal(pos, uci)!);
  if (captured && !worst)
    return { safe: true, text: `Safe. ${move} wins a ${captured.role}, and nothing of yours can then be won.` };
  if (captured && result.net > 0) {
    return {
      safe: true,
      text: `Safe. ${move} wins a ${captured.role}, and after they take back you are still ${count(result.net, 'point')} up.`,
    };
  }
  if (worst) return { safe: true, text: `Safe. ${move} is an even trade at worst.` };
  return { safe: true, text: `Safe. After ${move}, nothing of yours can be won.` };
}
