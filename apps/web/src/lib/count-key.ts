/**
 * What a count may be called (lib/count.ts, src/worker): a kind of finish and its name, or a
 * plan check-in's answer alone (`checkin:noticed`, `checkin:acted`, `checkin:not-noticed`), nothing else.
 */
export const COUNT_KEY =
  /^(?:(finished|played|hand|drill|round):[a-z0-9][a-z0-9/-]{0,59}|checkin:(noticed|acted|not-noticed))$/;
