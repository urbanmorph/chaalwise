import { describe, expect, it } from 'vitest';
import {
  beats,
  CHAIR_MEETINGS,
  condorcetWinner,
  firstPair,
  GROUPS,
  lookAhead,
  majorities,
  MEMBER_MEETINGS,
  OPTIONS,
  orderFor,
  place,
  runAgenda,
  sincere,
  tally,
  voteOptions,
  YOUR_GROUP,
  type Option,
} from '../src/lib/labs/agenda';

const [band, comedy, dance] = OPTIONS as [Option, Option, Option];

describe('who sets the agenda: the committee', () => {
  it('has three groups of four, each voting together, and no group a majority alone', () => {
    expect(GROUPS.map((g) => g.size)).toEqual([4, 4, 4]);
    const all = GROUPS.reduce((s, g) => s + g.size, 0);
    for (const g of GROUPS) {
      expect(g.size * 2).toBeLessThan(all);
      expect(new Set(g.ranking).size).toBe(3);
      expect(g.name && g.about).toBeTruthy();
    }
  });

  it('majorities cycle: band beats comedy, comedy beats dance and dance beats band, each 8 to 4', () => {
    expect(OPTIONS).toEqual(['band', 'comedy', 'dance']);
    expect(beats(band, comedy)).toBe(true);
    expect(beats(comedy, dance)).toBe(true);
    expect(beats(dance, band)).toBe(true);
    expect(tally(band, comedy)).toEqual({ band: 8, comedy: 4 });
    expect(tally(comedy, dance)).toEqual({ comedy: 8, dance: 4 });
    expect(tally(dance, band)).toEqual({ dance: 8, band: 4 });
  });

  it('lists the majorities in the circle they make, with the votes', () => {
    expect(majorities()).toEqual([
      { winner: 'band', loser: 'comedy', votes: 8, against: 4 },
      { winner: 'comedy', loser: 'dance', votes: 8, against: 4 },
      { winner: 'dance', loser: 'band', votes: 8, against: 4 },
    ]);
  });

  it('has no option that beats both others (no Condorcet winner)', () => {
    expect(condorcetWinner()).toBeUndefined();
    // Check by brute force, not by the helper alone.
    for (const x of OPTIONS) expect(OPTIONS.filter((y) => y !== x).every((y) => beats(x, y))).toBe(false);
  });

  it('a shortlist of two is decided by whoever picks the two: each pair has its own winner', () => {
    const winners = new Set(OPTIONS.flatMap((x, i) => OPTIONS.slice(i + 1).map((y) => (beats(x, y) ? x : y))));
    expect(winners).toEqual(new Set(OPTIONS));
  });
});

describe('who sets the agenda: the order of votes', () => {
  it('votes on the two options not held back first, then the winner against the one held back', () => {
    expect(firstPair('dance')).toEqual(['band', 'comedy']);
    const run = runAgenda('dance');
    expect(run.votes.map((v) => v.pair)).toEqual([
      ['band', 'comedy'],
      ['band', 'dance'],
    ]);
    expect(run.votes[0]!.count).toEqual({ band: 8, comedy: 4 });
    expect(run.winner).toBe('dance');
  });

  it('with everyone voting for the one they like more, the option held back to the last vote wins, whichever it is', () => {
    for (const held of OPTIONS) expect(runAgenda(held).winner).toBe(held);
    expect(new Set(OPTIONS.map((o) => runAgenda(o).winner)).size).toBe(3);
  });

  it('so the chair can make any option win, by holding it back', () => {
    for (const target of OPTIONS) expect(runAgenda(orderFor(target)).winner).toBe(target);
  });

  it('as chair, three meetings, each asking for a different winner', () => {
    expect(new Set(CHAIR_MEETINGS.map((m) => m.wants))).toEqual(new Set(OPTIONS));
    for (const m of CHAIR_MEETINGS) expect(m.who && m.why).toBeTruthy();
  });
});

describe('who sets the agenda: voting as a member', () => {
  const group = GROUPS.find((g) => g.id === YOUR_GROUP)!;

  it('you speak for the day scholars, who like dance most, then band, then comedy', () => {
    expect(group.ranking).toEqual(['dance', 'band', 'comedy']);
    expect(place('dance')).toBe(1);
    expect(place('comedy')).toBe(3);
  });

  it('each bot chair holds back its own favourite, so sincere voting would elect it', () => {
    for (const m of MEMBER_MEETINGS) {
      expect(m.held).toBe(orderFor(m.favourite));
      expect(runAgenda(m.held).winner).toBe(m.favourite);
      expect(m.chair && m.who).toBeTruthy();
    }
  });

  it('a sincere vote is for the option you like more', () => {
    expect(sincere(['band', 'dance'])).toBe('dance');
    expect(sincere(['comedy', 'band'])).toBe('band');
  });

  it('first meeting: voting sincerely elects comedy, your last choice; voting band first elects band, your second', () => {
    const m = MEMBER_MEETINGS[0]!;
    expect(m.favourite).toBe('comedy');
    expect(firstPair(m.held)).toEqual(['band', 'dance']);
    const options = voteOptions(m.held);
    expect(options).toEqual([
      { first: 'band', winner: 'band' },
      { first: 'dance', winner: 'comedy' },
    ]);
    expect(runAgenda(m.held, { first: 'dance' }).winner).toBe('comedy');
    expect(runAgenda(m.held, { first: 'band' }).winner).toBe('band');
  });

  it('second meeting: voting sincerely elects band, your second choice, and no vote of yours changes it', () => {
    const m = MEMBER_MEETINGS[1]!;
    expect(m.favourite).toBe('band');
    expect(firstPair(m.held)).toEqual(['comedy', 'dance']);
    expect(voteOptions(m.held).map((o) => o.winner)).toEqual(['band', 'band']);
  });

  it('looking ahead: what a sincere first vote leads to, and a strategic one that does better, if any', () => {
    expect(lookAhead(MEMBER_MEETINGS[0]!.held)).toEqual({
      sincere: { first: 'dance', winner: 'comedy' },
      better: { first: 'band', winner: 'band' },
    });
    expect(lookAhead(MEMBER_MEETINGS[1]!.held)).toEqual({ sincere: { first: 'dance', winner: 'band' } });
    // Better means a higher place for your group, never the same or lower.
    for (const held of OPTIONS) {
      const { sincere: s, better } = lookAhead(held);
      if (better) expect(place(better.winner)).toBeLessThan(place(s.winner));
      else for (const o of voteOptions(held)) expect(place(o.winner)).toBeGreaterThanOrEqual(place(s.winner));
    }
  });

  it('in the last vote, voting sincerely is always best for you', () => {
    for (const held of OPTIONS) {
      for (const first of firstPair(held)) {
        const pair = runAgenda(held, { first }).votes[1]!.pair;
        const other = pair.find((o) => o !== sincere(pair))!;
        const withSincere = runAgenda(held, { first, last: sincere(pair) }).winner;
        const withOther = runAgenda(held, { first, last: other }).winner;
        expect(place(withSincere)).toBeLessThanOrEqual(place(withOther));
      }
    }
  });

  it('your votes are counted with your group’s four, the others vote sincerely', () => {
    const run = runAgenda('comedy', { first: 'band' });
    expect(run.votes[0]!.count).toEqual({ band: 8, dance: 4 });
    const both: Option[] = ['band', 'dance'];
    expect(both).toContain(run.votes[0]!.winner);
  });
});
