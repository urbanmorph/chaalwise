import type { AttemptRecord } from '@chaalwise/core/progress';
import { PROFILE_SKILLS } from './profile-skills';

/** The skills drawn on the dashboard: those the app can measure now (not the ones waiting for practice games). */
export const CHART_SKILLS = PROFILE_SKILLS.filter((s) => !s.later);

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
  const skills: SkillStats[] = CHART_SKILLS.map(({ id, name, short }) => {
    const list = inPeriod(attempts[id]);
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
