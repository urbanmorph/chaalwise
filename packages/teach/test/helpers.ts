import { Chess } from 'chessops/chess';
import { parseFen } from 'chessops/fen';
import { parseSquare } from 'chessops/util';

export const pos = (fen: string) => Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
export const sq = (name: string) => parseSquare(name)!;
