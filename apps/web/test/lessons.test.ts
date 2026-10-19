import { readdirSync, readFileSync } from 'node:fs';
import { backRankWeak } from '@chaalwise/teach/endgame';
import { moveSafety } from '@chaalwise/teach/safety';
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
const STRATEGY = new URL('../src/content/lessons/strategy/', import.meta.url);
const read = (dir: URL) =>
  readdirSync(dir).map((file) => ({
    file,
    data: parse(readFileSync(new URL(file, dir), 'utf8').split(/^---$/m)[1]!) as Lesson,
  }));
const lessons = read(DIR);
const strategy = read(STRATEGY);
const steps = lessons.flatMap(({ file, data }) => data.steps.map((step) => ({ file, step })));
const step = (file: string, id: string) =>
  [
    ...steps,
    ...strategy.flatMap(({ file, data }) => data.steps.map((step) => ({ file: `strategy/${file}`, step }))),
  ].find((s) => s.file === file && s.step.id === id)!.step;

describe('lesson order', () => {
  it('places every strategy lesson after a lesson that exists', () => {
    const ids = new Set([
      ...lessons.map((l) => `chess/${l.file.replace('.md', '')}`),
      ...strategy.map((l) => `strategy/${l.file.replace('.md', '')}`),
    ]);
    for (const { file, data } of strategy) expect(ids.has(data.after!), `${file} comes after ${data.after}`).toBe(true);
  });

  it('explains square names before any lesson uses them', () => {
    const order = [...lessons]
      .sort((a, b) => a.data.stage - b.data.stage || a.data.order - b.data.order)
      .map((l) => l.file);
    expect(order[0]).toBe('coordinates.md');
  });

  it('does not use move-number notation (1. e4) in stage 0, where it has not been explained', () => {
    const stage0 = lessons.filter((l) => l.data.stage === 0).map((l) => readFileSync(new URL(l.file, DIR), 'utf8'));
    for (const text of stage0) expect(text).not.toMatch(/\b\d+\.\s?[a-hKQRBNO]/);
  });
});

describe('lesson claims', () => {
  it.each([
    ['mate-stalemate.md', 'mate-in-one'],
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
    const mate = step('mate-stalemate.md', 'is-it-mate');
    const stalemate = step('mate-stalemate.md', 'is-it-stalemate');
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

  it('piece values: taking the undefended rook is safe, taking the defended knight is not', () => {
    const s = step('piece-values.md', 'take-the-most');
    if (s.kind !== 'move') throw new Error('expected a move');
    const fen = toFen(s.position);
    expect(safetyVerdict(fen, 'd4a4').safe).toBe(true);
    expect(safetyVerdict(fen, 'd4d7').safe).toBe(false);
  });

  it('castling: the king really cannot castle through the attacked f1', () => {
    const s = step('castling.md', 'through-check');
    if (s.kind !== 'choice') throw new Error('expected a choice');
    expect(parseMoveText(toFen(s.position!), 'O-O')).toBeUndefined();
    expect(parseMoveText(toFen(s.position!), 'O-O-O')).toBe('e1c1');
  });

  it('count it through: exd5 exd5 leaves White two points up', () => {
    const s = step('strategy/count-it-through.md', 'on-the-board');
    if (s.kind !== 'read') throw new Error('expected a read step');
    expect(moveSafety(fromFen(toFen(s.position!)), 'e4d5').net).toBe(2);
  });

  it('only teaches a safe defence', () => {
    const s = step('safe-moves.md', 'defend-f7');
    if (s.kind !== 'move') throw new Error('expected a move');
    for (const uci of s.answers) expect(safetyVerdict(toFen(s.position), uci).safe).toBe(true);
  });
});

describe('what a lesson answer is evidence for', () => {
  const built = (path: string) => readFileSync(new URL(`../dist/${path}/index.html`, import.meta.url), 'utf8');
  const measured = (html: string) => [...html.matchAll(/measures&quot;:\[0,&quot;([a-z-]+)/g)].map((m) => m[1]);

  it('counts a strategy lesson answer towards its own strategy track', () => {
    for (const { file, data } of strategy) {
      const skills = measured(built(`skills/${file.replace('.md', '')}`));
      expect(skills.length, file).toBeGreaterThan(0);
      expect(new Set(skills), file).toEqual(new Set([data.skills[0]]));
    }
  });
});
