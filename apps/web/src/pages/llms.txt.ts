import type { APIRoute } from 'astro';
import { GAME_NAMES, REFERENCE_GAMES } from '@chaalwise/core/reference';
import { referenceEntries } from '../lib/reference-entries';

/** llms.txt: what Chaalwise is, for AI agents and answer engines, with a link to every
 *  section and every reference entry. Built from the reference collection, so it never
 *  misses an entry or lists one that is gone. */
export const GET: APIRoute = async ({ site }) => {
  const url = (path: string) => new URL(path, site).href;
  const entries = await referenceEntries();
  const sections = [
    ['Chess lessons', '/chess/', 'from the board to full games, with daily drills and puzzles by theme'],
    ['Poker lessons', '/poker/', 'guided first hands, practice tables and drills, with free practice points only'],
    ['Game-theory labs', '/labs/', 'small games against the computer: auctions, bargaining, the prisoner’s dilemma'],
    ['Skills', '/skills/', 'eleven skills such as thinking ahead, weighing odds and sizing a risk'],
    ['Work cases', '/cases/', 'the skills used on work and study decisions'],
    ['Reference', '/reference/', 'every idea, one page each'],
    ['Today’s puzzles', '/daily/', 'one chess and one poker puzzle every day'],
  ];
  const games = REFERENCE_GAMES.map((game) => {
    const lines = entries
      .filter((e) => e.data.game === game)
      .map((e) => `- [${e.data.title ?? e.data.term}](${url(`/reference/${e.id}/`)}): ${e.data.summary}`);
    return `## ${GAME_NAMES[game]} reference\n\n${lines.join('\n')}`;
  });
  const body = `# Chaalwise

> Free, short lessons in strategy and decision-making, each skill shown in chess, poker or a game-theory lab, used on work and study cases, and brought back by spaced review. Against the computer only. Poker uses free practice points that can never be bought, sold or cashed out. No money, no multiplayer, no account; progress stays on the learner's device.

## Sections

${sections.map(([name, path, what]) => `- [${name}](${url(path!)}): ${what}`).join('\n')}

${games.join('\n\n')}

## More

- [Sitemap](${url('/sitemap.xml')})
- [Source code (AGPL-3.0)](https://github.com/urbanmorph/chaalwise)
`;
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
