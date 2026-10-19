/** The practice drills, for the drills page and the reference search. Each id is the drill's anchor on /chess/drills/. */
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

export type Drill = (typeof DRILLS)[number];
