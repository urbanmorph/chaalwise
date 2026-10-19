import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

/**
 * A static chess diagram for pages that should carry no board script, such as
 * the home page. It uses the same piece set as the interactive board.
 */

/** The home page's position: Nc7+ forks the king and the rook. */
export const HERO = {
  fen: 'r3k3/5ppp/8/3N4/8/8/5PPP/6K1 w - - 0 1',
  move: 'd5c7',
  /** The pieces the move attacks, ringed on the diagram. */
  attacked: ['e8', 'a8'],
  pieces: 10,
};

const ROLES: Record<string, string> = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };

/** The piece set's images as data URIs, keyed like `white-knight`. Read at build time, so pages carry no script for them. */
let cached: Record<string, string> | undefined;
export function pieceImages(): Record<string, string> {
  if (cached) return cached;
  const css = readFileSync(
    createRequire(import.meta.url).resolve('chessground/assets/chessground.cburnett.css'),
    'utf8',
  );
  const images: Record<string, string> = {};
  for (const [, role, color, url] of css.matchAll(
    /piece\.(\w+)\.(white|black)\s*\{\s*background-image:\s*url\('([^']+)'\)/g,
  )) {
    images[`${color}-${role}`] = url!;
  }
  return (cached = images);
}

/** The pieces on a FEN's board, with White at the bottom: x and y in squares from the top left. */
export function diagramPieces(fen: string): { x: number; y: number; key: string }[] {
  return fen
    .split(' ')[0]!
    .split('/')
    .flatMap((row, y) => {
      let x = 0;
      return [...row].flatMap((ch) => {
        if (/\d/.test(ch)) {
          x += Number(ch);
          return [];
        }
        const piece = { x: x++, y, key: `${ch === ch.toUpperCase() ? 'white' : 'black'}-${ROLES[ch.toLowerCase()]}` };
        return [piece];
      });
    });
}
