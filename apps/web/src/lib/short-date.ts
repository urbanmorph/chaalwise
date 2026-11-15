/** A date as one short line, like "17 Nov 2026", the same on every device. */
export const shortDate = (at: Date): string =>
  at.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
