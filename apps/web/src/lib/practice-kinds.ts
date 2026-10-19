/** The practice generators a lesson step may name. Kept apart from the generators, so pages that only check names stay light. */
export const PRACTICE_KINDS = [
  'find-square',
  'find-square-black',
  'piece-squares',
  'win-hanging',
  'mate-kq',
  'mate-kr',
] as const;
export type PracticeKind = (typeof PRACTICE_KINDS)[number];

export const isPracticeKind = (kind: string): kind is PracticeKind =>
  (PRACTICE_KINDS as readonly string[]).includes(kind);
