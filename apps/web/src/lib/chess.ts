import type { Lesson } from '@chaalwise/core/lesson';
import { Chess, normalizeMove } from 'chessops/chess';
import { chessgroundDests } from 'chessops/compat';
import { INITIAL_FEN, makeFen, parseFen } from 'chessops/fen';
import { parseSquare } from 'chessops/util';
import { makeSan, parseSan } from 'chessops/san';
import type { Move, NormalMove } from 'chessops/types';
import { materialSignature } from '@chaalwise/teach/endgame';
// Parsing and checking a lesson's move (castling written e1g1) is shared with the teaching helpers.
import { legal, standardUci } from '@chaalwise/teach/position';
import { isPracticeKind } from './practice-kinds';
import { isChessSkill } from './profile-skills';

/** Lessons may write `start`, a FEN, or `moves: e4 e5 Nf3` (standard notation from the start). */
export const START = INITIAL_FEN;
/** An empty board, for square steps and the coordinates drill. */
export const EMPTY_BOARD = '8/8/8/8/8/8/8/8 w - - 0 1';
export const turnOf = (fen: string): 'white' | 'black' => (fen.split(' ')[1] === 'b' ? 'black' : 'white');
export function toFen(position: string): string {
  if (position === 'start') return START;
  if (position === 'empty') return EMPTY_BOARD;
  return position.startsWith('moves:') ? positionFromMoves(position.slice(6)) : position;
}

/** A legal position from a FEN, `start`, `empty` or `moves: …`, or undefined if it is not one. */
export const setup = (fen: string): Chess | undefined => {
  const parsed = parseFen(toFen(fen));
  if (!parsed.isOk) return undefined;
  const pos = Chess.fromSetup(parsed.value);
  return pos.isOk ? pos.value : undefined;
};

/** Problems with chess content, as Zod-style issues, so broken content fails the build. */
export type Issue = { path: (string | number)[]; message: string };

/** Why a move cannot be used as written: illegal here, or legal but not in the board's standard form. */
export function moveIssue(pos: Chess, uci: string): string | undefined {
  const move = legal(pos, uci);
  if (!move) return `${uci} is not a legal move here`;
  // The player compares strings, and the board always produces the standard form.
  if (standardUci(pos, move) !== uci) return `${uci} is legal, but write it as ${standardUci(pos, move)}`;
}

/** Why a board cannot be drawn, if it cannot. */
function boardIssue(position: string): string | undefined {
  try {
    return parseFen(toFen(position)).isOk ? undefined : `not a readable board: ${position}`;
  } catch (error) {
    return (error as Error).message;
  }
}

/** The most moves each basic mate needs from any position, so a move limit is always fair. */
const WORST_CASE: Record<string, number> = { KQvK: 10, KRvK: 16 };

/** A play-it-out step: a lone king against the learner, who is to move, with material that mates and a fair move limit. */
function playIssues(pos: Chess, within: number): string[] {
  const material = materialSignature(pos);
  if (!material) return ['a play step needs a lone king for the computer'];
  if (material.strong !== pos.turn) return ['a play step needs the learner to move first'];
  if (pos.isInsufficientMaterial()) return [`${material.signature} cannot mate`];
  if (pos.isEnd()) return ['the game is already over'];
  const worst = WORST_CASE[material.signature];
  if (!worst) return [`no known move limit for ${material.signature}: add its worst case to WORST_CASE`];
  return within < worst ? [`${material.signature} needs a move limit of at least ${worst}`] : [];
}

export function chessLessonIssues(lesson: Lesson): Issue[] {
  const issues: Issue[] = [];
  if (lesson.measures && !isChessSkill(lesson.measures))
    issues.push({ path: ['measures'], message: `there is no skill called ${lesson.measures}` });
  lesson.steps.forEach((step, i) => {
    if ('measures' in step && step.measures && !isChessSkill(step.measures)) {
      issues.push({ path: ['steps', i, 'measures'], message: `there is no skill called ${step.measures}` });
    }
    if ('practice' in step && step.practice && !isPracticeKind(step.practice)) {
      issues.push({ path: ['steps', i, 'practice'], message: `there is no practice called ${step.practice}` });
    }
    if (step.position === undefined) return;
    // Read and square steps only show a board, so any readable board will do, even one with no kings.
    if (step.kind === 'read' || step.kind === 'square') {
      if (!boardIssue(step.position)) return;
      issues.push({ path: ['steps', i, 'position'], message: boardIssue(step.position)! });
      return;
    }
    let pos: Chess | undefined;
    try {
      pos = setup(step.position);
    } catch (error) {
      issues.push({ path: ['steps', i, 'position'], message: (error as Error).message });
      return;
    }
    if (!pos) {
      issues.push({ path: ['steps', i, 'position'], message: `not a legal position: ${step.position}` });
      return;
    }
    if (step.kind === 'play')
      issues.push(...playIssues(pos, step.within).map((message) => ({ path: ['steps', i], message })));
    if (step.kind !== 'move') return;
    step.answers.forEach((uci, j) => {
      const message = moveIssue(pos, uci);
      if (message) issues.push({ path: ['steps', i, 'answers', j], message });
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
  const move = legal(pos, uci);
  if (!move) throw new Error(`${uci} is not a legal move in ${fen}`);
  pos.play(move);
  return makeFen(pos.toSetup());
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
  const move = parseSan(pos, trimmed) ?? (legal(pos, trimmed.toLowerCase()) as Move | undefined);
  return move && 'from' in move ? standardUci(pos, move) : undefined;
}

/** A lesson's move in standard notation (Nf3, O-O), for feedback. */
export function toSan(fen: string, uci: string): string {
  const pos = position(fen);
  const move = legal(pos, uci);
  if (!move) throw new Error(`${uci} is not a legal move in ${fen}`);
  return makeSan(pos, move);
}

/** The position after a game written in standard notation from the start, e.g. "e4 e5 Nf3". */
export function positionFromMoves(moves: string): string {
  const pos = position(START);
  moves
    .split(/\s+/)
    .filter(Boolean)
    .forEach((san, i) => {
      const move = parseSan(pos, san);
      if (!move) throw new Error(`move ${i + 1}, ${san}, is not legal here`);
      pos.play(move);
    });
  return makeFen(pos.toSetup());
}
