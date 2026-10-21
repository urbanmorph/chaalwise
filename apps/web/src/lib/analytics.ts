/**
 * Cloudflare Web Analytics: visits and page speed, with no cookies and nothing
 * about learners. The token is public by design (it ships in every page); it is
 * empty until the site is added in the UrbanMorph Cloudflare account, and then
 * the beacon loads only on the live site, never in tests or local builds.
 */
export const BEACON_TOKEN = '4c253a8ddd83492b88adfe9bf06a0988';
export const LIVE_HOST = 'chaalwise.com';
