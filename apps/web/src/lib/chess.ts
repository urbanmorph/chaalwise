import type { Lesson } from '@chaalwise/core/lesson';
import { Chess, normalizeMove } from 'chessops/chess';
import { chessgroundDests } from 'chessops/compat';
import { INITIAL_FEN, makeFen, parseFen } from 'chessops/fen';
import { makeSquare, parseSquare, parseUci, roleToChar, squareFile } from 'chessops/util';
import { makeSan, parseSan } from 'chessops/san';
import type { Move, NormalMove } from 'chessops/types';

/** Lessons may write `start` for the initial position. */
export const START = INITIAL_FEN;
export const toFen = (position: string) => (position === 'start' ? START : position);

const setup = (fen: string): Chess | undefined => {
  const parsed = parseFen(toFen(fen));
  if (!parsed.isOk) return undefined;
  const pos = Chess.fromSetup(parsed.value);
  return pos.isOk ? pos.value : undefined;
};

/** A move in standard notation, as lessons write it (castling as e1g1), made legal-checkable. */
function legalMove(pos: Chess, uci: string): NormalMove | undefined {
  const move = parseUci(uci);
  if (!move || !('from' in move)) return undefined;
  const normal = normalizeMove(pos, move) as NormalMove;
  return pos.isLegal(normal) ? normal : undefined;
}

/** Problems with a lesson's chess content, as Zod-style issues, so a broken lesson fails the build. */
type Issue = { path: (string | number)[]; message: string };

export function chessLessonIssues(lesson: Lesson): Issue[] {
  const issues: Issue[] = [];
  lesson.steps.forEach((step, i) => {
    if (step.kind === 'read' || step.position === undefined) return;
    const pos = setup(step.position);
    if (!pos) {
      issues.push({
        path: ['steps', i, 'position'],
        message: `not a legal position: ${step.position}`,
      });
      return;
    }
    if (step.kind !== 'move') return;
    step.answers.forEach((uci, j) => {
      const move = legalMove(pos, uci);
      const path = ['steps', i, 'answers', j];
      if (!move) issues.push({ path, message: `${uci} is not a legal move here` });
      // The player compares strings, and the board always produces the standard form.
      else if (standardUci(pos, move) !== uci) {
        issues.push({
          path,
          message: `${uci} is legal, but write it as ${standardUci(pos, move)}`,
        });
      }
    });
  });
  return issues;
}

const position = (fen: string) => {
  const pos = setup(fen);
  if (!pos) throw new Error(`not a legal position: ${fen}`);
  return pos;
};

/** Destinations for chessground, castling offered both as king-two-squares and king-onto-rook. */
export const legalDests = (fen: string) => chessgroundDests(position(fen));

export function playUci(fen: string, uci: string): string {
  const pos = position(fen);
  const move = legalMove(pos, uci);
  if (!move) throw new Error(`${uci} is not a legal move in ${fen}`);
  pos.play(move);
  return makeFen(pos.toSetup());
}

/** A move as lessons write it: castling as the king's real destination (e1g1), not king-takes-rook. */
function standardUci(pos: Chess, move: NormalMove): string {
  const piece = pos.board.get(move.from);
  const isCastle = piece?.role === 'king' && pos.board.get(move.to)?.color === piece.color;
  const to = isCastle
    ? move.from + (squareFile(move.to) > squareFile(move.from) ? 2 : -2)
    : move.to;
  return (
    makeSquare(move.from) + makeSquare(to) + (move.promotion ? roleToChar(move.promotion) : '')
  );
}

/** A drag on the board as a standard move, promoting to a queen. */
export function toUci(fen: string, orig: string, dest: string): string {
  const pos = position(fen);
  const from = parseSquare(orig)!;
  const to = parseSquare(dest)!;
  const piece = pos.board.get(from);
  const lastRank = piece?.color === 'white' ? 7 : 0;
  const promotion = piece?.role === 'pawn' && Math.floor(to / 8) === lastRank ? 'queen' : undefined;
  return standardUci(pos, { ...(normalizeMove(pos, { from, to }) as NormalMove), promotion });
}

/** A typed move, in standard notation (Nf3, O-O) or coordinates (g1f3), if it is legal. */
export function parseMoveText(fen: string, text: string): string | undefined {
  const pos = position(fen);
  // 0-0 and 0-0-0 (zeros) are a common way to write castling.
  const trimmed = text.trim().replace(/^0-0(-0)?/, (m) => m.replaceAll('0', 'O'));
  const move =
    parseSan(pos, trimmed) ?? (legalMove(pos, trimmed.toLowerCase()) as Move | undefined);
  return move && 'from' in move ? standardUci(pos, move) : undefined;
}

/** A lesson's move in standard notation (Nf3, O-O), for feedback. */
export function toSan(fen: string, uci: string): string {
  const pos = position(fen);
  const move = legalMove(pos, uci);
  if (!move) throw new Error(`${uci} is not a legal move in ${fen}`);
  return makeSan(pos, move);
}
