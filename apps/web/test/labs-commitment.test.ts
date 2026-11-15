import { describe, expect, it } from 'vitest';
import {
  credible,
  DEFENCES,
  firstMoves,
  newcomerOpens,
  OWNERS,
  ownerAnswer,
  readTheTree,
  rivalOpens,
  threatTotal,
  treeAfter,
  type Tree,
} from '../src/lib/labs/commitment';
import { between, seeded } from '../src/lib/labs/seeded';

const tree = (share: number, war: number): Tree => ({
  out: { newcomer: 0, owner: 10 },
  share: { newcomer: 4, owner: share },
  war: { newcomer: -2, owner: war },
});

describe('who moves first: judging a threat', () => {
  it('has three stall-owners who threaten a price war, each with a name, a threat and a reason', () => {
    expect(OWNERS.map((o) => o.id)).toEqual(['raju', 'meena', 'sunil']);
    for (const o of OWNERS) expect(o.name && o.says && o.know).toBeTruthy();
  });

  it('the newcomer gains by opening if the owner shares, loses if it fights, and gets nothing by staying out', () => {
    for (const { tree: t } of OWNERS) {
      expect(t.share.newcomer).toBeGreaterThan(t.out.newcomer);
      expect(t.war.newcomer).toBeLessThan(t.out.newcomer);
      // The owner would rather nobody opened at all.
      expect(t.out.owner).toBeGreaterThan(Math.max(t.share.owner, t.war.owner));
    }
  });

  it('an owner carries out the threat only if a price war pays it more than sharing, when the time comes', () => {
    expect(ownerAnswer(tree(5, 1))).toBe('share');
    expect(ownerAnswer(tree(2, 3))).toBe('war');
    const r = seeded(1);
    for (let i = 0; i < 500; i++) {
      const t = tree(between(0, 9, r), between(0, 9, r));
      expect(credible(t)).toBe(t.war.owner > t.share.owner);
    }
  });

  it('Raju’s threat is empty, Meena’s bulk deal makes hers believable, and Sunil’s deal, which he can cancel for free, does not', () => {
    const answers = Object.fromEntries(OWNERS.map((o) => [o.id, ownerAnswer(o.tree)]));
    expect(answers).toEqual({ raju: 'share', meena: 'war', sunil: 'share' });
    // Sunil's words sound like a commitment, but his numbers are Raju's.
    expect(OWNERS[2]!.tree).toEqual(OWNERS[0]!.tree);
  });

  it('working backwards, the newcomer opens beside Raju and Sunil and stays away from Meena', () => {
    expect(OWNERS.map((o) => newcomerOpens(o.tree))).toEqual([true, false, true]);
  });

  it('reading the tree beats believing every threat and ignoring every threat', () => {
    expect(threatTotal(() => false)).toBe(0);
    expect(threatTotal(() => true)).toBe(6);
    expect(threatTotal(readTheTree)).toBe(8);
  });

  it('Meena gains by having moved first: her deal keeps the newcomer out, 10 points against the 5 she would share', () => {
    const meena = OWNERS[1]!.tree;
    expect(newcomerOpens(meena)).toBe(false);
    expect(meena.out.owner).toBe(10);
    expect(OWNERS[0]!.tree.share.owner).toBe(5);
  });
});

describe('who moves first: moving first yourself', () => {
  it('has two rivals deciding whether to open beside your stall, each with a name and a way of thinking', () => {
    expect(DEFENCES.map((d) => d.rival.name)).toEqual(['Asha', 'Farhan']);
    for (const d of DEFENCES) expect(d.rival.about && d.deal).toBeTruthy();
  });

  it('a rival opens if your answer, when the time comes, leaves it better off than staying out', () => {
    for (const d of DEFENCES) expect(rivalOpens(d.tree)).toBe(newcomerOpens(d.tree));
  });

  it('words alone change nothing: announcing a price war leaves the tree, and the rival’s choice, as they were', () => {
    for (const d of DEFENCES) {
      expect(treeAfter(d, 'announce')).toEqual(treeAfter(d, 'nothing'));
      expect(rivalOpens(treeAfter(d, 'announce'))).toBe(true);
    }
  });

  it('a binding deal makes the threat believable, so the rival stays out', () => {
    for (const d of DEFENCES) {
      const t = treeAfter(d, 'lease');
      expect(credible(t)).toBe(true);
      expect(rivalOpens(t)).toBe(false);
      // The deal changes only your numbers, never the rival's.
      for (const k of ['out', 'share', 'war'] as const) expect(t[k].newcomer).toBe(d.tree[k].newcomer);
    }
  });

  it('the cheap deal pays (8 against 5 from sharing), the dear one does not (4 against 5)', () => {
    const best = DEFENCES.map((d) => firstMoves(d));
    expect(best[0]).toEqual({ nothing: 5, announce: 5, lease: 8 });
    expect(best[1]).toEqual({ nothing: 5, announce: 5, lease: 4 });
  });

  it('once the rival has opened, a price war costs you: sharing pays more, whatever you announced', () => {
    for (const d of DEFENCES) expect(d.tree.share.owner).toBeGreaterThan(d.tree.war.owner);
  });
});
