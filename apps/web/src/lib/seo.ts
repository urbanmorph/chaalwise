import { SKILLS } from '@chaalwise/core/skills';

/**
 * Structured data for search engines (schema.org JSON-LD): the site and its
 * maker on the home page, and each lesson as a free learning resource. The
 * layout adds each page's own address.
 */
export const SITE = 'https://chaalwise.com';

const MAKER = { '@type': 'Organization', name: 'UrbanMorph', url: 'https://www.urbanmorph.com/' };

export const SITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: 'Chaalwise',
      url: `${SITE}/`,
      inLanguage: 'en',
      description: 'Free, short lessons in strategy and decision-making, shown in chess, poker and game-theory labs.',
      publisher: MAKER,
    },
    { ...MAKER, sameAs: ['https://github.com/urbanmorph'] },
  ],
};

const GAMES: Record<string, string> = { chess: 'Chess', poker: 'Poker', strategy: 'Strategy', case: 'Work case' };

/** A lesson as a schema.org LearningResource: free, in English, teaching the skills it trains. */
export function lessonSchema(lesson: { data: { title: string; summary: string; game: string; skills?: string[] } }) {
  const skills = (lesson.data.skills ?? []).map((s) => SKILLS[s as keyof typeof SKILLS]).filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: lesson.data.title,
    description: lesson.data.summary,
    learningResourceType: lesson.data.game === 'case' ? 'Case study' : 'Lesson',
    about: GAMES[lesson.data.game],
    ...(skills.length ? { teaches: skills } : {}),
    inLanguage: 'en',
    isAccessibleForFree: true,
    provider: MAKER,
  };
}
