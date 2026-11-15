import type { GradedStep } from '@chaalwise/core/lesson';
import { deal } from './deal';
import { shuffle } from './random';

/**
 * "Which idea fits?": a situation from work, study or everyday life, with no
 * idea named, and the learner picks the idea it calls for from the strategy
 * lessons they have finished. People often fail to use an idea because they do
 * not notice it applies (recognition failure, Babadimas and others 2019), so
 * spotting it among look-alikes is practised on its own. Each situation is a
 * review card (`fits/<idea>/<name>`), so answers feed review like any question.
 */

/** A strategy idea, by its lesson. */
export interface Idea {
  title: string;
  summary: string;
  href: string;
  /** The track its answers count towards. */
  measures: string | undefined;
}

export interface FitsItem {
  /** The lesson whose idea the situation calls for, as `strategy/blunder-check`. */
  idea: string;
  situation: string;
  /** Why the idea fits. */
  why: string;
  /** Look-alike ideas, each with why it does not fit here. */
  nearMisses: Record<string, string>;
  /** Ideas that fit as well, never offered as a wrong answer. */
  alsoFits?: string[] | undefined;
}

/** Every idea by lesson id, and every situation by review card. */
export interface FitsBank {
  ideas: Record<string, Idea>;
  items: Record<string, FitsItem>;
}

/** Situations in a round. */
export const FITS_ROUND = 6;
/** Strategy lessons finished before rounds open: fewer leaves too little to choose between. */
export const FITS_FROM = 3;
const MIN_OPTIONS = 3;
const MAX_OPTIONS = 4;

const ideasDone = (bank: FitsBank, done: ReadonlySet<string>) => Object.keys(bank.ideas).filter((id) => done.has(id));

export const fitsOpen = (bank: FitsBank, done: ReadonlySet<string>): boolean =>
  ideasDone(bank, done).length >= FITS_FROM;

/** The finished ideas that could be offered as wrong answers. */
function others(item: FitsItem, bank: FitsBank, done: ReadonlySet<string>): string[] {
  return ideasDone(bank, done).filter((id) => id !== item.idea && !item.alsoFits?.includes(id));
}

const askable = (item: FitsItem | undefined, bank: FitsBank, done: ReadonlySet<string>): item is FitsItem =>
  !!item && fitsOpen(bank, done) && done.has(item.idea) && others(item, bank, done).length >= MIN_OPTIONS - 1;

/** A situation as a question, or nothing if its idea, or enough others to choose from, is not finished yet. */
export function fitsStep(
  id: string,
  bank: FitsBank,
  done: ReadonlySet<string>,
  random: () => number,
): GradedStep | undefined {
  const item = bank.items[id];
  if (!askable(item, bank, done)) return undefined;
  const pool = others(item, bank, done);
  // The look-alikes written for this situation first, then other finished ideas.
  const wrong = [
    ...shuffle(
      pool.filter((o) => o in item.nearMisses),
      random,
    ),
    ...shuffle(
      pool.filter((o) => !(o in item.nearMisses)),
      random,
    ),
  ].slice(0, MAX_OPTIONS - 1);
  const idea = bank.ideas[item.idea]!;
  const title = (o: string) => bank.ideas[o]!.title;
  const whyNot = (o: string) =>
    item.nearMisses[o] ??
    `${title(o)} is for another kind of moment: ${bank.ideas[o]!.summary.replace(/^./, (c) => c.toLowerCase())}`;
  return {
    kind: 'choice',
    id,
    prompt: `${item.situation} Which idea fits?`,
    options: [idea.title, ...wrong.map(title)],
    answer: 0,
    feedback: ['', ...wrong.map(whyNot)],
    explanation: [
      `The idea is “${idea.title}”. ${item.why}`,
      ...wrong.map((o) => `Why not “${title(o)}”? ${whyNot(o)}`),
    ].join(' '),
    link: { href: idea.href, text: `Go back to the lesson: ${idea.title}` },
    measures: idea.measures,
  };
}

/** A round: situations whose ideas take turns, so no two in a row call for the same one. */
export function fitsIds(bank: FitsBank, done: ReadonlySet<string>, count: number, random: () => number): string[] {
  const byIdea = new Map<string, string[]>();
  for (const [id, item] of Object.entries(bank.items))
    if (askable(item, bank, done)) byIdea.set(item.idea, [...(byIdea.get(item.idea) ?? []), id]);
  return deal([...byIdea.values()], count, random);
}

/** Review and practice questions with every situation the learner can be asked, under its own review card. */
export function withFits(
  steps: Record<string, GradedStep>,
  bank: FitsBank,
  done: ReadonlySet<string>,
  random: () => number,
): Record<string, GradedStep> {
  const asked = Object.keys(bank.items).flatMap((id) => {
    const step = fitsStep(id, bank, done, random);
    return step ? [[id, step] as const] : [];
  });
  return { ...steps, ...Object.fromEntries(asked) };
}
