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
  '/poker/position/': '/reference/poker/position/',
  // It teaches range and equity; equity is what people search for, and what its questions work out.
  '/poker/ranges-and-equity/': '/reference/poker/equity/',
  '/poker/expected-value/': '/reference/poker/expected-value/',
  '/poker/implied-odds/': '/reference/poker/implied-odds/',
  '/poker/tilt/': '/reference/poker/tilt/',
};
