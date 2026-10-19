/** Chess lessons live under /chess/, strategy lessons under /skills/. Kept free of Astro imports so tests and pages share it. */
export const lessonHref = (lesson: { id: string; data: { game: string } }) =>
  lesson.data.game === 'strategy' ? `/skills/${lesson.id.replace(/^strategy\//, '')}/` : `/${lesson.id}/`;
