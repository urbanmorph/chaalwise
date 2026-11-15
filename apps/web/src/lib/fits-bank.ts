import { getCollection } from 'astro:content';
import type { FitsBank } from './fits';
import { lessonHref, strategyLessons } from './lessons';

/** Every strategy idea and every "Which idea fits?" situation, for review and practice. A situation naming an unknown idea fails the build. */
export async function fitsBank(): Promise<FitsBank> {
  const ideas = Object.fromEntries(
    (await strategyLessons()).map((l) => [
      l.id,
      { title: l.data.title, summary: l.data.summary, href: lessonHref(l), measures: l.data.skills[0] },
    ]),
  );
  const known = (slug: string) => {
    const id = `strategy/${slug}`;
    if (!(id in ideas)) throw new Error(`no strategy lesson ${id}`);
    return id;
  };
  const items = Object.fromEntries(
    (await getCollection('fits')).map(({ id, data }) => [
      `fits/${id}`,
      {
        idea: known(id.split('/')[0]!),
        situation: data.prompt,
        why: data.explanation,
        nearMisses: Object.fromEntries(Object.entries(data.feedback).map(([slug, why]) => [known(slug), why])),
        alsoFits: data.alsoFits?.map(known),
      },
    ]),
  );
  return { ideas, items };
}
