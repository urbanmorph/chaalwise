/** The chess drills, for the drills page and the reference search. Each id is the drill's anchor on /chess/drills/. */
export const DRILLS = [
  {
    id: 'find-the-square',
    title: 'Coordinates: find the square',
    summary: 'Thirty seconds: find as many squares as you can, with no letters or numbers on the board.',
  },
  {
    id: 'name-the-square',
    title: 'Coordinates: name the square',
    summary: 'The reverse: a square lights up, and you type its name. Thirty seconds.',
  },
  {
    id: 'where-can-it-go',
    title: 'Pieces: where can it go?',
    summary: 'A piece on a random square. Tap every square it can move to, then the next one. Five positions.',
  },
  {
    id: 'is-this-move-safe',
    title: 'Safety: is this move safe?',
    summary: 'Before every move, ask: can they win something, or mate me, straight after it? Judge ten moves.',
  },
  {
    id: 'spot-the-loose-piece',
    title: 'Safety: spot the loose piece',
    summary:
      'Loose pieces drop off: a piece nothing defends is the first target for a fork. Tap every one, on both sides. Five positions.',
  },
  {
    id: 'basic-mates',
    title: 'Basic mates against the clock',
    summary: 'Mate the lone king from a random start. Your score is the moves you have left over.',
  },
] as const;

/** The poker drills, ten exercises a round, dealt and checked by the engine. Each id is the drill's anchor on /poker/drills/. */
export const POKER_DRILLS = [
  {
    id: 'count-the-outs',
    kind: 'outs',
    lesson: 'outs-and-odds',
    title: 'Poker: count the outs',
    summary:
      'Your two cards and the shared cards in poker: how many unseen cards would make your flush or straight? Ten hands.',
  },
  {
    id: 'call-or-fold',
    kind: 'pot-odds',
    lesson: 'outs-and-odds',
    title: 'Poker: call or fold?',
    summary: 'A pot, a call and your chance to win: is the call worth its price in poker? Ten decisions.',
  },
  {
    id: 'the-nuts',
    kind: 'nuts',
    lesson: 'reading-the-board',
    title: 'Poker: what is the best hand possible?',
    summary: 'Five shared cards: pick the best hand anyone could make with them, called the nuts in poker. Ten boards.',
  },
  {
    id: 'play-or-fold',
    kind: 'preflop',
    lesson: 'starting-hands',
    title: 'Poker: play or fold?',
    summary:
      'Your two cards and your seat, against one opponent or a full poker table: play the hand, or fold it? Ten hands.',
  },
  {
    id: 'guess-your-chance',
    kind: 'equity',
    lesson: 'ranges-and-equity',
    title: 'Poker: guess your chance',
    summary:
      'Your cards and the shared cards: guess how often your poker hand wins against any two, then see the true figure. Ten hands.',
  },
] as const;

export type Drill = { id: string; title: string; summary: string };

/** Every drill, chess and poker, with its game: for the reference search. */
export const ALL_DRILLS = [
  ...DRILLS.map((drill) => ({ ...drill, game: 'chess' as const })),
  ...POKER_DRILLS.map(({ id, title, summary }) => ({ id, title, summary, game: 'poker' as const })),
];
