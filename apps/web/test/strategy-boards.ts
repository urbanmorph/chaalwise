import { VALUE } from '@chaalwise/teach/position';
import type { Chess } from 'chessops/chess';
import type { Color } from 'chessops/types';
import { toFen } from '../src/lib/chess';
import { lessonsIn } from './content';

/** Helpers for tests that check what a strategy lesson's chessboard claims. */
const strategy = new Map(lessonsIn('strategy').map(({ file, data }) => [file.replace('.md', ''), data]));

/** A strategy lesson, by its file name, with its questions looked up. */
export const lesson = (id: string) => {
  const data = strategy.get(id);
  if (!data) throw new Error(`no strategy lesson ${id}`);
  return data;
};

/** The position and arrows a lesson's step shows. */
export const board = (id: string, step: string) => {
  const s = lesson(id).steps.find((st) => 'id' in st && st.id === step);
  if (!s || !('position' in s) || !s.position) throw new Error(`${id} ${step}: no board`);
  return { fen: toFen(s.position), arrows: ('arrows' in s ? s.arrows : undefined) ?? [] };
};

/** One side's material in points, kings left out. */
export const material = (pos: Chess, color: Color) =>
  (['pawn', 'knight', 'bishop', 'rook', 'queen'] as const).reduce(
    (sum, role) => sum + pos.board.pieces(color, role).size() * VALUE[role],
    0,
  );
