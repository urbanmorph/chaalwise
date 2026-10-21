import { shuffle, type Random } from './seeded';

/**
 * Gain or loss?, after Tversky and Kahneman's framing problems (1981): the same
 * choice, between a sure thing and a gamble that keeps as much on average, is
 * shown once as what is kept and once as what is lost. The lesson is in where
 * the learner's answer changes with the description alone.
 */
export type Frame = 'gain' | 'loss';
export type Pick = 'sure' | 'gamble';

export interface Scenario {
  id: string;
  /** A short name for the debrief. */
  name: string;
  /** The setting: what is at stake. */
  intro: string;
  /** Where the loss frame starts, if not where the gain frame does. */
  lossIntro?: string;
  total: number;
  /** What is at stake, as a plural noun. */
  unit: string;
  /** The word for keeping it, and for losing it. */
  verb: Record<Frame, string>;
  /** How it ends, in neutral words, such as "homes saved". */
  end: string;
  /** Kept for sure by the safe plan. */
  sure: number;
  /** The gamble's chance of keeping all of it, as k in n; otherwise none is kept. */
  chance: [number, number];
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'flood',
    name: 'A flood and 600 homes',
    intro: 'A flood is heading for a town of 600 homes. You must choose one of two plans.',
    total: 600,
    unit: 'homes',
    end: 'homes saved',
    verb: { gain: 'saved', loss: 'lost' },
    sure: 200,
    chance: [1, 3],
  },
  {
    id: 'jobs',
    name: 'A firm with 6,000 jobs',
    intro: 'A firm in trouble has three factories and 6,000 jobs. You must choose one of two rescue plans.',
    total: 6000,
    unit: 'jobs',
    end: 'jobs kept',
    verb: { gain: 'kept', loss: 'lost' },
    sure: 2000,
    chance: [1, 3],
  },
  {
    id: 'points',
    name: 'A points game with 400 points',
    intro: 'In a points game you start with no points, and 400 are on offer. Choose one of two plans.',
    lossIntro: 'In a points game you are given 400 points to start. Choose one of two plans.',
    total: 400,
    unit: 'points',
    end: 'points in hand',
    verb: { gain: 'won', loss: 'lost' },
    sure: 200,
    chance: [1, 2],
  },
  {
    id: 'trees',
    name: 'A tree disease and 800 trees',
    intro: 'A tree disease has reached a park of 800 trees. You must choose one of two treatments.',
    total: 800,
    unit: 'trees',
    end: 'trees saved',
    verb: { gain: 'saved', loss: 'lost' },
    sure: 200,
    chance: [1, 4],
  },
];

const n = (x: number) => x.toLocaleString('en-GB');

/** The two plans as shown in a frame: plan A is the sure thing, plan B the gamble. */
export function shown(s: Scenario, frame: Frame) {
  const [k, of] = s.chance;
  const verb = s.verb[frame];
  return frame === 'gain'
    ? {
        intro: s.intro,
        sure: `${n(s.sure)} ${s.unit} ${verb} for sure.`,
        gamble: `A ${k} in ${of} chance that all ${n(s.total)} are ${verb}, and a ${of - k} in ${of} chance that none are.`,
      }
    : {
        intro: s.lossIntro ?? s.intro,
        sure: `${n(s.total - s.sure)} ${s.unit} ${verb} for sure.`,
        gamble: `A ${k} in ${of} chance that none are ${verb}, and a ${of - k} in ${of} chance that all ${n(s.total)} are ${verb}.`,
      };
}

/** The choice in plain outcomes, the same in either frame. */
export function restated(s: Scenario): string {
  const [k, of] = s.chance;
  return `Plan A ends with ${n(s.sure)} ${s.end} for sure. Plan B ends with all ${n(s.total)} (${k} in ${of}) or none (${of - k} in ${of}): ${n(s.sure)} on average.`;
}

export interface FramingRound {
  scenario: Scenario;
  frame: Frame;
}

/**
 * Eight rounds: each choice once in the first half, in a random order and
 * frame (two of each), and once in the second half in the other frame, never
 * the same choice twice in a row.
 */
export function framingRounds(random: Random): FramingRound[] {
  const frames = shuffle<Frame>(['gain', 'gain', 'loss', 'loss'], random);
  const first = shuffle(SCENARIOS, random).map((scenario, i) => ({ scenario, frame: frames[i]! }));
  let second = shuffle(first, random);
  if (second[0]!.scenario === first[3]!.scenario) second = [...second.slice(1), second[0]!];
  return [
    ...first,
    ...second.map(({ scenario, frame }) => ({ scenario, frame: frame === 'gain' ? 'loss' : 'gain' }) as const),
  ];
}

export interface Answer {
  round: FramingRound;
  pick: Pick;
}

/**
 * Each choice's two answers side by side. `usual` counts the flips most people
 * make: the sure thing when it is put as a gain, the gamble when it is put as a loss.
 */
export function tally(answers: Answer[]) {
  const pickIn = (s: Scenario, frame: Frame) =>
    answers.find((a) => a.round.scenario.id === s.id && a.round.frame === frame)?.pick;
  const rows = SCENARIOS.map((scenario) => {
    const gain = pickIn(scenario, 'gain');
    const loss = pickIn(scenario, 'loss');
    return { scenario, gain, loss, flipped: !!gain && !!loss && gain !== loss };
  });
  return {
    rows,
    flipped: rows.filter((r) => r.flipped).length,
    usual: rows.filter((r) => r.gain === 'sure' && r.loss === 'gamble').length,
    sureInGain: rows.filter((r) => r.gain === 'sure').length,
    sureInLoss: rows.filter((r) => r.loss === 'sure').length,
  };
}
