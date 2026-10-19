import type { AttemptRecord } from '@chaalwise/core/progress';
import { trackAttempts } from './profile';
import { PROFILE_SKILLS } from './profile-skills';
import { TRACKS } from './skill-tracks';

/** The tracks drawn on the dashboard: those chess trains. One not measured yet is drawn faded until it is. */
export const CHART_SKILLS = PROFILE_SKILLS.filter((s) => TRACKS.find((t) => t.id === s.id)!.chess > 0);

export interface SkillStats {
  id: string;
  name: string;
  short: string;
  tries: number;
  firstTry: number;
  /** Share answered first time, or undefined with no tries. */
  rate: number | undefined;
}

/** The dashboard's numbers for the last `days` days (all time when undefined). */
export function dashboard(attempts: Record<string, AttemptRecord[]>, days: number | undefined, now = new Date()) {
  const since = days === undefined ? -Infinity : now.getTime() - days * 86_400_000;
  const inPeriod = (list: AttemptRecord[] = []) => list.filter((a) => a.at.getTime() >= since);
  const byTrack = trackAttempts(attempts);
  const skills: SkillStats[] = CHART_SKILLS.map(({ id, name, short }) => {
    const list = inPeriod(byTrack[id]);
    const firstTry = list.filter((a) => a.outcome === 'first-try').length;
    return { id, name, short, tries: list.length, firstTry, rate: list.length ? firstTry / list.length : undefined };
  });
  const all = Object.values(attempts).flatMap(inPeriod);
  const firstTry = all.filter((a) => a.outcome === 'first-try').length;
  return {
    tries: all.length,
    firstTimeRate: all.length ? firstTry / all.length : undefined,
    daysPractised: new Set(all.map((a) => a.at.toDateString())).size,
    skills,
  };
}

/** A point on the radar: axis `i` of `n`, starting straight up and going clockwise, `value` from 0 to 1 of `radius`. */
export function radarPoint(i: number, n: number, value: number, radius: number): { x: number; y: number } {
  const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
  return { x: Math.cos(angle) * radius * value, y: Math.sin(angle) * radius * value };
}
