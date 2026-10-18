/** The build's identifier (git short hash, or BUILD_ID), set in astro.config.ts. */
declare const __BUILD_ID__: string;
/** True in a tombstone build (SW_TOMBSTONE=1): pages then remove the worker instead of registering it. */
declare const __TOMBSTONE__: boolean;
