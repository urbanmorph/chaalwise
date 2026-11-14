/**
 * The live site's address: counting (lib/count.ts) happens only there, never in tests or local
 * builds. Cloudflare Web Analytics needs nothing here: its auto-install injects the beacon into
 * every page of chaalwise.com, so the site adds none of its own (test/home.test.ts).
 */
export const LIVE_HOST = 'chaalwise.com';
