import { readdirSync, readFileSync } from 'node:fs';
import { referenceSchema, type ReferenceEntry } from '@chaalwise/core/reference';
import { attacks } from 'chessops/attacks';
import { parseSquare } from 'chessops/util';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { legalMoves, play } from '@chaalwise/teach/position';
import { setup } from '../src/lib/chess';
import { referenceIssues } from '../src/lib/reference';

/**
 * The build proves every diagram is legal. These tests prove what the entries
 * say about them, and that every link goes somewhere.
 */
const ROOT = new URL('../src/content/reference/', import.meta.url);
const LESSONS = new URL('../src/content/lessons/', import.meta.url);
const entries = readdirSync(ROOT).flatMap((game) =>
  readdirSync(new URL(`${game}/`, ROOT)).map((file) => {
    const text = readFileSync(new URL(`${game}/${file}`, ROOT), 'utf8');
    return {
      id: `${game}/${file.replace('.md', '')}`,
      data: referenceSchema.parse(parse(text.split(/^---$/m)[1]!)) as ReferenceEntry,
    };
  }),
);
const byId = new Map(entries.map((e) => [e.id, e.data]));
const lessonIds = new Set(
  readdirSync(LESSONS).flatMap((dir) =>
    readdirSync(new URL(`${dir}/`, LESSONS)).map((f) => `${dir}/${f.replace('.md', '')}`),
  ),
);

describe('the reference', () => {
  it('has entries for every part: strategy, chess, poker and game theory', () => {
    for (const game of ['strategy', 'chess', 'poker', 'labs'])
      expect(entries.filter((e) => e.data.game === game).length).toBeGreaterThan(5);
  });

  it('keeps each entry in the folder of its game, with a unique name', () => {
    for (const { id, data } of entries) expect(id.split('/')[0], id).toBe(data.game);
    const terms = entries.map((e) => e.data.term.toLowerCase());
    expect(terms.length).toBe(new Set(terms).size);
  });

  it('links only to entries and lessons that exist', () => {
    for (const { id, data } of entries) {
      for (const r of data.related) expect(byId.has(r), `${id} links to ${r}`).toBe(true);
      if (data.lesson) expect(lessonIds.has(data.lesson), `${id} names lesson ${data.lesson}`).toBe(true);
    }
  });

  it('draws only legal positions and moves', () => {
    for (const { id, data } of entries) expect(referenceIssues(data), id).toEqual([]);
  });
});

describe('what the diagrams claim', () => {
  const after = (id: string) => {
    const e = byId.get(id)!;
    return { e, pos: play(setup(e.position!)!, e.move!) };
  };
  const attacked = (id: string) => {
    const { e, pos } = after(id);
    const to = parseSquare(e.move!.slice(2, 4))!;
    return attacks(pos.board.get(to)!, to, pos.board.occupied);
  };

  it('fork: the moved piece attacks both ringed pieces, one of them with check', () => {
    const { e, pos } = after('chess/fork');
    for (const sq of e.highlight!) expect(attacked('chess/fork').has(parseSquare(sq)!), sq).toBe(true);
    expect(pos.isCheck()).toBe(true);
  });

  it('pin: after the bishop move, the pinned knight has no legal move', () => {
    const { e, pos } = after('chess/pin');
    expect(legalMoves(pos).filter((m) => m.startsWith(e.highlight![0]!))).toEqual([]);
  });

  it('skewer: the king is in check, and whatever Black does, the rook can take the queen', () => {
    const { e, pos } = after('chess/skewer');
    expect(pos.isCheck()).toBe(true);
    const capture = `${e.move!.slice(2, 4)}${e.highlight![1]}`;
    for (const reply of legalMoves(pos)) expect(legalMoves(play(pos, reply)), reply).toContain(capture);
  });

  it('discovered attack: the knight gives check, and the rook now sees the queen', () => {
    const { e, pos } = after('chess/discovered-attack');
    expect(pos.isCheck()).toBe(true);
    const rook = parseSquare('e1')!;
    expect(attacks(pos.board.get(rook)!, rook, pos.board.occupied).has(parseSquare(e.highlight![1]!)!)).toBe(true);
  });

  it('back-rank mate and smothered mate are mate', () => {
    for (const id of ['chess/back-rank-mate', 'chess/smothered-mate'])
      expect(after(id).pos.isCheckmate(), id).toBe(true);
  });

  it('stalemate is stalemate', () => {
    expect(setup(byId.get('chess/stalemate')!.position!)!.isStalemate()).toBe(true);
  });

  it('en passant takes the pawn that passed', () => {
    const { e, pos } = after('chess/en-passant');
    expect(pos.board.get(parseSquare(e.highlight![0]!)!)).toBeUndefined();
  });
});
