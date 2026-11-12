/**
 * Lessons that teach the same idea a reference entry explains, so both would
 * compete in search. The lesson stays in the course (it has the questions and
 * counts towards progress) and names the entry as its canonical address; the
 * sitemap lists only the entry. Kept free of imports so the layout and the
 * sitemap integration share it.
 */
export const CANONICAL_ELSEWHERE: Record<string, string> = {
  '/poker/hand-rankings/': '/reference/poker/hand-rankings/',
  '/poker/outs-and-odds/': '/reference/poker/outs/',
};
