/**
 * Who moves first: commitment and credible threats, in an entry-deterrence game
 * (Schelling 1960; Dixit and Nalebuff 1991). A newcomer decides whether to open
 * a tea stall beside an owner's; if it opens, the owner shares the customers or
 * starts a price war. Each side then acts in its own interest when the time
 * comes, so a threat counts only if carrying it out pays the threatener.
 *
 * First the learner is the newcomer, judging three owners' threats. Then the
 * learner owns the stall and may move first: say nothing, announce a price war,
 * or sign a binding deal that makes a price war pay. The points are this lab's
 * design: small whole numbers, a month's takings in points.
 */

/** Points to each side at the end of a branch. */
export interface Outcome {
  newcomer: number;
  owner: number;
}

/** A game tree in plain words: the newcomer stays out, or opens and the owner shares or fights. */
export interface Tree {
  out: Outcome;
  share: Outcome;
  war: Outcome;
}

export type Answer = 'share' | 'war';

/** What the owner does once the newcomer has opened: whatever pays it more then, whatever it said before. */
export const ownerAnswer = (t: Tree): Answer => (t.war.owner > t.share.owner ? 'war' : 'share');

/** A threat of a price war is believable only if the owner would carry it out when the time comes. */
export const credible = (t: Tree): boolean => ownerAnswer(t) === 'war';

/** Working backwards: open if what the owner will really do leaves the newcomer better off than staying out. */
export const newcomerOpens = (t: Tree): boolean => t[ownerAnswer(t)].newcomer > t.out.newcomer;

/** A rival who thinks ahead decides as a newcomer working backwards does. */
export const rivalOpens = newcomerOpens;

/** The usual numbers: alone, the owner takes 10; sharing, 4 and 5; a price war leaves the newcomer −2 and the owner 1. */
const PLAIN: Tree = {
  out: { newcomer: 0, owner: 10 },
  share: { newcomer: 4, owner: 5 },
  war: { newcomer: -2, owner: 1 },
};

/** A tree with the owner's numbers changed: a deal changes what the owner gets, never what the newcomer gets. */
const owners = (out: number, share: number, war: number): Tree => ({
  out: { ...PLAIN.out, owner: out },
  share: { ...PLAIN.share, owner: share },
  war: { ...PLAIN.war, owner: war },
});

export type OwnerId = 'raju' | 'meena' | 'sunil';

export interface Owner {
  id: OwnerId;
  name: string;
  /** The threat, in the owner's words. */
  says: string;
  /** What you know about the owner's position. */
  know: string;
  tree: Tree;
}

export const OWNERS: Owner[] = [
  {
    id: 'raju',
    name: 'Raju',
    says: 'Open beside me and I will halve my prices until you close.',
    know: 'Raju has run the only tea stall at the bus stand for years. His margins are already thin.',
    tree: PLAIN,
  },
  {
    id: 'meena',
    name: 'Meena',
    says: 'Open beside me and I will cut my prices until you close.',
    know: 'Last month Meena signed a two-year deal to buy milk in bulk at a low price. She must sell a lot of tea to use it all, so selling cheap tea to every customer now pays her more than sharing them.',
    tree: owners(10, 2, 3),
  },
  {
    id: 'sunil',
    name: 'Sunil',
    says: 'I have signed a deal with my supplier to fight any newcomer with low prices.',
    know: 'Sunil’s deal lets him cancel at any time, at no cost. Apart from what he says, his stall is just like Raju’s.',
    tree: PLAIN,
  },
];

/** Part one's points for a newcomer who opens where `opens` says, against owners who act in their own interest. */
export const threatTotal = (opens: (owner: Owner) => boolean): number =>
  OWNERS.reduce((sum, o) => sum + (opens(o) ? o.tree[ownerAnswer(o.tree)].newcomer : o.tree.out.newcomer), 0);

/** Open only where the owner's own numbers say it will share. */
export const readTheTree = (o: Owner): boolean => newcomerOpens(o.tree);

/** What you can do before the rival decides, when the stall is yours. */
export type FirstMove = 'nothing' | 'announce' | 'lease';

export interface Defence {
  /** The rival's name, and how it decides, completing a sentence that starts with the name. */
  rival: { name: string; about: string };
  /** The binding deal on offer, in plain words. */
  deal: string;
  tree: Tree;
  /** The tree once the deal is signed. */
  signed: Tree;
}

export const DEFENCES: Defence[] = [
  {
    rival: {
      name: 'Asha',
      about: 'thinks ahead: she looks at what you would really do if she opened, not at what you say.',
    },
    deal: 'A two-year deal to buy milk in bulk at a low price. Alone, you take 8 instead of 10. But with so much milk to use, a price war would pay you 3, more than the 2 you would get by sharing.',
    tree: PLAIN,
    signed: owners(8, 2, 3),
  },
  {
    rival: { name: 'Farhan', about: 'also thinks ahead, and reads your numbers before he decides.' },
    deal: 'The only bulk deal on offer is for five years, at a high price. Alone, you take 4 instead of 10. A price war would pay you 2, more than the 1 you would get by sharing.',
    tree: PLAIN,
    signed: owners(4, 1, 2),
  },
];

/** The tree the rival faces after your first move: an announcement is only words, so only the deal changes it. */
export const treeAfter = (d: Defence, move: FirstMove): Tree => (move === 'lease' ? d.signed : d.tree);

/** Your points after each first move, if the rival thinks ahead and you then answer in your own interest. */
export function firstMoves(d: Defence): Record<FirstMove, number> {
  const points = (move: FirstMove) => {
    const t = treeAfter(d, move);
    return rivalOpens(t) ? t[ownerAnswer(t)].owner : t.out.owner;
  };
  return { nothing: points('nothing'), announce: points('announce'), lease: points('lease') };
}
