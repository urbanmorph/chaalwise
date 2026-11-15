import { shortDate } from '../short-date';

/**
 * What code in the browser knows about the labs. The labs list (labs.ts) stays at build time: a page gets the few
 * labs it needs as data, so adding a lab adds nothing to any other page's JavaScript.
 */

/** A lab, enough to name it and link to it. */
export interface LabRef {
  slug: string;
  title: string;
}

/** The lab each idea is met in, keyed by idea (`<game>/<idea>`), as labIndex in labs.ts builds it. */
export type LabIndex = Record<string, LabRef>;

/** A question's idea, `<game>/<idea>`, from its card id: `<game>/<idea>/<name>`, or `reference/<game>/<idea>/<name>` for cards saved before the corpus began. */
export function ideaOf(cardId: string): string {
  const parts = cardId.split('/');
  const [game, idea] = parts[0] === 'reference' ? parts.slice(1) : parts;
  return `${game}/${idea}`;
}

export const labHref = (lab: Pick<LabRef, 'slug'>): string => `/labs/${lab.slug}/`;

/** A lab named in a sentence, such as "the Nim lab"; a title that starts with "The" drops it: "the bonus rule lab". */
export const theLab = (lab: Pick<LabRef, 'title'>): string => `the ${lab.title.replace(/^The /, '')} lab`;

/** Each lab, with when it was last played to the end on this device and how often, from the finished records. */
export function labsPlayed(labs: LabRef[], records: { lessonId: string; completedAt: Date; times: number }[]) {
  return labs.map(({ slug, title }) => {
    const record = records.find((r) => r.lessonId === `labs/${slug}`);
    return { slug, title, at: record?.completedAt, times: record?.times ?? 0 };
  });
}

/** When a lab was last played: one short line, like "Not yet", so the list does not move as it loads. */
export const playedLabel = (at: Date | undefined, times: number): string =>
  !at ? 'Not yet' : `${shortDate(at)}${times > 1 ? `, ${times} times` : ''}`;
