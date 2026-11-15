import { describe, expect, it } from 'vitest';
import { fitsIds, fitsOpen, fitsStep, withFits, type FitsBank } from '../src/lib/fits';
import { deal } from '../src/lib/deal';

const idea = (title: string, measures = 'think-ahead') => ({
  title,
  summary: `What ${title} is about.`,
  href: `/skills/${title.toLowerCase().replaceAll(' ', '-')}/`,
  measures,
});
const bank: FitsBank = {
  ideas: {
    'strategy/blunder-check': idea('The blunder check'),
    'strategy/their-next-move': idea('Their next move'),
    'strategy/count-it-through': idea('Count it through', 'calculate'),
    'strategy/look-at-three': idea('Look at three', 'calculate'),
    'strategy/finish-the-job': idea('Finish the job', 'plan-long'),
  },
  items: {
    'fits/blunder-check/email': {
      idea: 'strategy/blunder-check',
      situation: 'Your finger is on Send.',
      why: 'One look at what could go wrong catches it.',
      nearMisses: {
        'strategy/their-next-move': 'Nobody has made a move to answer yet.',
        'strategy/count-it-through': 'There is no chain of costs to add up.',
      },
    },
    'fits/blunder-check/deposit': {
      idea: 'strategy/blunder-check',
      situation: 'The owner wants money today.',
      why: 'Ask what the payment lets them do.',
      nearMisses: { 'strategy/finish-the-job': 'Nothing here is nearly done.' },
      alsoFits: ['strategy/their-next-move'],
    },
    'fits/count-it-through/gym': {
      idea: 'strategy/count-it-through',
      situation: 'A free month, then a year at a price.',
      why: 'Follow the chain to the end.',
      nearMisses: { 'strategy/blunder-check': 'The danger is in the sum, not a reply.' },
    },
    'fits/look-at-three/offer': {
      idea: 'strategy/look-at-three',
      situation: 'Your first thought is to match the offer.',
      why: 'Name more options first.',
      nearMisses: { 'strategy/count-it-through': 'There is nothing yet to add up.' },
    },
  },
};
const done = (...slugs: string[]) => new Set(slugs.map((s) => `strategy/${s}`));
const firstThree = done('blunder-check', 'their-next-move', 'count-it-through');

describe('"Which idea fits?" rounds', () => {
  it('open once three strategy lessons are finished', () => {
    expect(fitsOpen(bank, done('blunder-check', 'their-next-move'))).toBe(false);
    expect(fitsOpen(bank, new Set(['chess/board', 'chess/fork', 'strategy/blunder-check']))).toBe(false);
    expect(fitsOpen(bank, firstThree)).toBe(true);
  });

  it('ask only about ideas from finished lessons, with only finished ideas to choose from', () => {
    const step = fitsStep('fits/blunder-check/email', bank, firstThree, Math.random)!;
    expect(step.kind).toBe('choice');
    if (step.kind !== 'choice') return;
    expect(step.options).toEqual(['The blunder check', expect.any(String), expect.any(String)]);
    expect(new Set(step.options)).toEqual(new Set(['The blunder check', 'Their next move', 'Count it through']));
    expect(step.answer).toBe(0);
    expect(fitsStep('fits/look-at-three/offer', bank, firstThree, Math.random)).toBeUndefined();
  });

  it('show the situation with no idea or skill named before the answer', () => {
    const step = fitsStep('fits/blunder-check/email', bank, firstThree, Math.random)!;
    expect(step.prompt).toBe('Your finger is on Send. Which idea fits?');
    expect(step.prompt).not.toMatch(/blunder/i);
  });

  it('say afterwards which idea it is, why, and why each other option does not fit, with a link to the lesson', () => {
    const step = fitsStep('fits/blunder-check/email', bank, firstThree, Math.random)!;
    if (step.kind !== 'choice') throw new Error('not a choice');
    expect(step.explanation).toMatch(/^The idea is “The blunder check”\. One look at what could go wrong catches it\./);
    expect(step.explanation).toContain('Why not “Their next move”? Nobody has made a move to answer yet.');
    expect(step.explanation).toContain('Why not “Count it through”? There is no chain of costs to add up.');
    const theirs = step.options.indexOf('Their next move');
    expect(step.feedback![theirs]).toBe('Nobody has made a move to answer yet.');
    expect(step.feedback![0]).toBe('');
    expect(step.link).toEqual({ href: '/skills/the-blunder-check/', text: 'Go back to the lesson: The blunder check' });
    expect(step.measures).toBe('think-ahead');
  });

  it('prefer the near misses written for the situation, and fill up with other finished ideas', () => {
    const all = done('blunder-check', 'their-next-move', 'count-it-through', 'look-at-three', 'finish-the-job');
    for (let i = 0; i < 20; i++) {
      const step = fitsStep('fits/blunder-check/email', bank, all, Math.random)!;
      if (step.kind !== 'choice') throw new Error('not a choice');
      expect(step.options).toHaveLength(4);
      expect(step.options).toEqual(expect.arrayContaining(['Their next move', 'Count it through']));
      // An idea with no reason written for it gets one from its summary.
      const filler = step.options.findIndex(
        (o) => !['The blunder check', 'Their next move', 'Count it through'].includes(o),
      );
      expect(step.feedback![filler]).toMatch(/is for another kind of moment: what /);
    }
  });

  it('never offer an idea that also fits as a wrong answer', () => {
    const all = done('blunder-check', 'their-next-move', 'count-it-through', 'finish-the-job');
    for (let i = 0; i < 20; i++) {
      const step = fitsStep('fits/blunder-check/deposit', bank, all, Math.random)!;
      if (step.kind !== 'choice') throw new Error('not a choice');
      expect(step.options).not.toContain('Their next move');
    }
    // With too few other ideas left to choose from, the situation waits.
    expect(fitsStep('fits/blunder-check/deposit', bank, firstThree, Math.random)).toBeUndefined();
  });

  it('deal a round of situations whose ideas take turns, never two of one idea in a row', () => {
    const all = done('blunder-check', 'their-next-move', 'count-it-through', 'look-at-three', 'finish-the-job');
    const ids = fitsIds(bank, all, 6, Math.random);
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
    for (let i = 1; i < ids.length; i++) expect(ids[i]!.split('/')[1]).not.toBe(ids[i - 1]!.split('/')[1]);
    expect(fitsIds(bank, done('blunder-check'), 6, Math.random)).toEqual([]);
  });

  it('join review and mixed practice as questions, under their own review cards', () => {
    const steps = withFits({}, bank, firstThree, Math.random);
    expect(Object.keys(steps).sort()).toEqual(['fits/blunder-check/email', 'fits/count-it-through/gym']);
    expect(steps['fits/count-it-through/gym']!.id).toBe('fits/count-it-through/gym');
  });
});

describe('dealing in turn', () => {
  it('takes one from each pile in turn until there are enough', () => {
    expect(deal([['a1', 'a2', 'a3'], ['b1'], ['c1', 'c2']], 5, () => 0)).toHaveLength(5);
    const ids = deal([['a1', 'a2', 'a3'], ['b1'], ['c1', 'c2']], 3, () => 0);
    expect(new Set(ids.map((id) => id[0]))).toEqual(new Set(['a', 'b', 'c']));
  });
});
