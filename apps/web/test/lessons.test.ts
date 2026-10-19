import { readdirSync, readFileSync } from 'node:fs';
import { backRankWeak } from '@chaalwise/teach/endgame';
import { fromFen, play } from '@chaalwise/teach/position';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import type { Lesson } from '@chaalwise/core/lesson';
import { parseMoveText, toFen } from '../src/lib/chess';
import { safetyVerdict } from '../src/lib/drills';

/**
 * The build proves every move is legal. These tests prove what the lessons
 * claim about them: that a mate is a mate, and that "safe" agrees with the
 * teaching helpers. Lesson text is written by people; the board decides.
 */
const DIR = new URL('../src/content/lessons/chess/', import.meta.url);
const lessons = readdirSync(DIR).map((file) => ({
  file,
  data: parse(readFileSync(new URL(file, DIR), 'utf8').split(/^---$/m)[1]!) as Lesson,
}));
const steps = lessons.flatMap(({ file, data }) => data.steps.map((step) => ({ file, step })));
const step = (file: string, id: string) => steps.find((s) => s.file === file && s.step.id === id)!.step;

describe('lesson claims', () => {
  it.each([
    ['check-and-mate.md', 'mate-in-one'],
    ['blunder-check.md', 'checks-first'],
    ['back-rank.md', 'rook-mates'],
    ['back-rank.md', 'black-mates'],
  ])('%s %s: every answer mates', (file, id) => {
    const s = step(file, id);
    if (s.kind !== 'move') throw new Error('expected a move');
    for (const uci of s.answers) expect(play(fromFen(toFen(s.position)), uci).isCheckmate()).toBe(true);
  });

  it('gives the king a square with every luft answer', () => {
    const s = step('back-rank.md', 'luft');
    if (s.kind !== 'move') throw new Error('expected a move');
    for (const uci of s.answers) expect(backRankWeak(play(fromFen(toFen(s.position)), uci), 'white')).toBe(false);
  });

  it('labels the mate and stalemate positions correctly', () => {
    const mate = step('check-and-mate.md', 'is-it-mate');
    const stalemate = step('check-and-mate.md', 'is-it-stalemate');
    expect(mate.kind === 'choice' && fromFen(toFen(mate.position!)).isCheckmate()).toBe(true);
    expect(stalemate.kind === 'choice' && fromFen(toFen(stalemate.position!)).isStalemate()).toBe(true);
  });

  it.each([
    ['early-g6', 'g6', false],
    ['knight-takes', 'Nxe5', false],
    ['two-knights', 'Bc5', false],
  ] as const)('safe-moves %s: the answer agrees with the helpers about %s', (id, san, safe) => {
    const s = step('safe-moves.md', id);
    if (s.kind !== 'choice') throw new Error('expected a choice');
    const fen = toFen(s.position!);
    expect(safetyVerdict(fen, parseMoveText(fen, san)!).safe).toBe(safe);
    expect(s.options[s.answer]).toMatch(safe ? /^(Safe|Yes)/ : /^(Not safe|No)/);
  });

  it('only teaches a safe defence', () => {
    const s = step('safe-moves.md', 'defend-f7');
    if (s.kind !== 'move') throw new Error('expected a move');
    for (const uci of s.answers) expect(safetyVerdict(toFen(s.position), uci).safe).toBe(true);
  });
});
