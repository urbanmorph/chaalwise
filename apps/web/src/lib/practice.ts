import type { GradedStep } from '@chaalwise/core/lesson';
import { hangingPosition, mateStart, pieceSquares, type Random } from '@chaalwise/teach/generate';
import { toSan } from './chess';
import { randomSquare } from './drills';
import type { PracticeKind } from './practice-kinds';

/**
 * Practice in fresh positions: each kind turns a generator into a step,
 * worded like a lesson step. A lesson step that names a kind comes back in
 * review, or in "Practise again", as a new position of the same idea.
 */
export { PRACTICE_KINDS, type PracticeKind } from './practice-kinds';

const ordinal = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`;

export function practiceStep(kind: PracticeKind, random: Random): GradedStep {
  switch (kind) {
    case 'find-square':
    case 'find-square-black': {
      const square = randomSquare(random);
      const black = kind === 'find-square-black';
      return {
        kind: 'square',
        id: 'practice',
        prompt: black ? `You are Black, looking from the other side. Find ${square}.` : `Find ${square}.`,
        answers: [square],
        orientation: black ? 'black' : 'white',
        hint: `The ${square[0]}-file, then the ${ordinal(Number(square[1]))} rank.`,
        explanation: `${square} is where the ${square[0]}-file crosses the ${ordinal(Number(square[1]))} rank.`,
      };
    }
    case 'piece-squares': {
      const drill = pieceSquares(random);
      return {
        kind: 'square',
        id: 'practice',
        prompt: `Click any square the ${drill.role} on ${drill.square} can move to.`,
        position: drill.fen,
        coordinates: true,
        answers: drill.reachable,
        hint: `Follow the ${drill.role}'s lines from ${drill.square}, stopping where a piece is in the way.`,
        explanation: `The ${drill.role} can reach ${drill.reachable.length} squares from here.`,
      };
    }
    case 'win-hanging': {
      const p = hangingPosition(random);
      return {
        kind: 'move',
        id: 'practice',
        prompt: 'One black piece can be won. Win it.',
        position: p.fen,
        answers: p.answers,
        hint: 'Look for a black piece that is undefended, or attacked by something cheaper.',
        explanation: `${toSan(p.fen, p.answers[0]!)} wins the piece on ${p.target}.`,
      };
    }
    case 'mate-kq':
    case 'mate-kr': {
      const queen = kind === 'mate-kq';
      return {
        kind: 'play',
        id: 'practice',
        prompt: `Mate the lone king with your king and ${queen ? 'queen' : 'rook'}.`,
        position: mateStart(random, queen ? 'KQvK' : 'KRvK'),
        goal: 'checkmate',
        within: queen ? 20 : 30,
        opponent: 'lone-king',
        hint: queen
          ? 'Box the king in with the queen a knight’s move away, then bring your king.'
          : 'Cut the king off with the rook, then walk your king up.',
        explanation: queen
          ? 'Box, shrink, bring the king, mate.'
          : 'Cut off, walk the king up, check when the kings face each other.',
      };
    }
  }
}
