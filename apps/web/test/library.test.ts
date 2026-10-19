import { describe, expect, it } from 'vitest';
import { DRILLS } from '../src/lib/drill-list';
import { libraryItems } from '../src/lib/library';
import { matchesQuery } from '../src/lib/search';

const entry = {
  id: 'chess/fork',
  data: {
    term: 'Fork',
    game: 'chess',
    kind: 'tactic',
    level: 'beginner',
    aliases: ['Double attack'],
    summary: 'One piece attacks two.',
  },
} as const;
const lesson = {
  id: 'chess/coordinates',
  data: { title: 'Name the squares', summary: 'Every square has a name.', game: 'chess', stage: 0 },
} as const;
const strategyLesson = {
  id: 'strategy/blunder-check',
  data: { title: 'The blunder check', summary: 'Ask what could go wrong.', game: 'strategy', stage: 1 },
} as const;

describe('the searchable library', () => {
  const items = libraryItems([entry], [lesson, strategyLesson], DRILLS);
  const find = (title: string) => items.find((i) => i.title === title)!;

  it('puts reference entries, lessons and drills in one list, each with its type and game', () => {
    expect(find('Fork')).toMatchObject({
      type: 'entry',
      game: 'chess',
      href: '/reference/chess/fork/',
      meta: 'Tactic, beginner',
    });
    expect(find('Name the squares')).toMatchObject({
      type: 'lesson',
      game: 'chess',
      href: '/chess/coordinates/',
      meta: 'Lesson, stage 0',
    });
    expect(find('The blunder check')).toMatchObject({
      type: 'lesson',
      game: 'strategy',
      href: '/skills/blunder-check/',
      meta: 'Strategy lesson',
    });
    expect(find('Coordinates: find the square')).toMatchObject({
      type: 'practice',
      game: 'chess',
      href: '/chess/drills/#find-the-square',
      meta: 'Practice drill',
    });
  });

  it('lists every drill once, each with its own anchor', () => {
    const anchors = DRILLS.map((d) => d.id);
    expect(new Set(anchors).size).toBe(anchors.length);
    expect(items.filter((i) => i.type === 'practice')).toHaveLength(DRILLS.length);
  });

  it('finds lessons and drills by words in their summaries too', () => {
    expect(matchesQuery(find('Name the squares').search, 'square name')).toBe(true);
    expect(matchesQuery(find('Fork').search, 'double attack')).toBe(true);
  });
});
