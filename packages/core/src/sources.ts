import { z } from 'zod';

/**
 * Where a piece of content comes from, and what its licence lets the site do
 * with it. The site will charge for packs, so non-commercial sources are kept
 * out everywhere, and paid content also keeps out share-alike and
 * no-derivatives sources (see supporting-docs: content strategy, sourcing).
 */
export const LICENCES = [
  'own',
  'public-domain',
  'CC0',
  'CC-BY',
  'CC-BY-SA',
  'CC-BY-NC',
  'CC-BY-ND',
  /** Written permission from the author. */
  'permission',
  /** An idea from a book or paper, told in our own words and cited by name and year. */
  'cited-idea',
] as const;
export type Licence = (typeof LICENCES)[number];

export const sourceSchema = z
  .object({
    title: z.string().min(1),
    url: z.url().optional(),
    licence: z.enum(LICENCES),
    /** The credit line the licence asks for, such as "Lichess puzzle database, CC0". */
    credit: z.string().min(1).optional(),
  })
  .strict();
export type Source = z.infer<typeof sourceSchema>;

/** Free content is for everyone; paid content is sold in a pack. Content with no tier is free. */
const tier = z.enum(['free', 'paid']);
export type Tier = z.infer<typeof tier>;

/** The front-matter fields every kind of content may carry. */
export const provenance = { tier: tier.optional(), sources: z.array(sourceSchema).optional() };

/** Share-alike and no-derivatives sources may be used in free content, never in paid. */
const NOT_PAID: Licence[] = ['CC-BY-SA', 'CC-BY-ND'];

/** Why content of a tier may not use these sources: one line per source it may not use. */
export function licenceIssues(tier: Tier | undefined, sources: Source[] = []): string[] {
  return sources.flatMap(({ title, licence }) => {
    if (licence === 'CC-BY-NC')
      return [`${title} is ${licence}: non-commercial sources cannot be used once the site charges`];
    if (tier === 'paid' && NOT_PAID.includes(licence)) return [`${title} is ${licence}, which paid content cannot use`];
    return [];
  });
}

/** Adds a schema issue for each source the content's tier may not use, so a wrong licence fails the build. */
export function checkLicences(content: { tier?: Tier; sources?: Source[] }, ctx: z.RefinementCtx) {
  for (const message of licenceIssues(content.tier, content.sources))
    ctx.addIssue({ code: 'custom', path: ['sources'], message });
}
