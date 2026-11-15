import type { Lab } from './labs';

/** What a lab teaches and how it plays, for its page and the labs index. */
export interface LabAbout {
  /** The idea it teaches, in a sentence. */
  idea: string;
  /** How it plays, in a sentence. */
  plays: string;
}

/** Each lab's idea and play, by its slug. Kept apart from LABS, which lesson pages load to know which lab a question is from. */
export const LAB_ABOUT: Record<Lab['slug'], LabAbout> = {
  'prisoners-dilemma': {
    idea: 'Cooperation pays when you will meet again, nobody knows which round is the last, and the other side answers in kind.',
    plays: 'About ten rounds against each of five bots: cooperate or defect, and watch the points.',
  },
  'rock-paper-scissors': {
    idea: 'If you are predictable, someone can exploit you. A random mix cannot be beaten.',
    plays: '30 throws against a bot that learns your habits as you play.',
  },
  'sealed-bid-auction': {
    idea: 'The winner of an auction for something of uncertain value is usually the one who overestimated it.',
    plays: 'Five jars of coins, one secret bid each, against four bots.',
  },
  nim: {
    idea: 'Work backwards from the goal: find the positions you want to leave, and the first move follows.',
    plays:
      'Take one to three counters from a pile; whoever takes the last one wins. Five games against a bot that plays perfectly when it can.',
  },
  'rule-finder': {
    idea: 'To find out whether you are right, include tests that would prove you wrong, not only ones that would confirm you.',
    plays: 'Guess the hidden rule behind a few numbers by trying your own; announce it when you are sure.',
  },
  'split-the-pie': {
    idea: 'Know your walk-away point (what you get with no deal) and theirs before you bargain: the deal lies between them.',
    plays: 'Five negotiations over 100 points against bots, each side with its own walk-away point.',
  },
  'which-bag': {
    idea: 'Start from how common something is, then adjust for what you see. And a streak of luck usually ends.',
    plays: 'Guess which bag a ball came from, then pick one player to back for the next round after a lucky one.',
  },
  'gain-or-loss': {
    idea: 'The same choice, put as a gain or as a loss, gets different answers. Restate it the other way before you decide.',
    plays:
      'Eight choices between a sure thing and a gamble, then see where your answers changed with the wording alone.',
  },
  'bonus-rule': {
    idea: 'People do what a rule rewards, not what you hoped for. Before you set one, ask what is the cheapest way to score on it.',
    plays: 'Four weeks setting the bonus for a support team of bots, and seeing what they do to earn it.',
  },
  'ask-the-panel': {
    idea: 'Guesses made alone, then averaged, cancel out each other’s errors. Guesses that follow the first voice do not.',
    plays: 'Six boxes of dots to estimate with a panel of bots: some rounds alone, some after hearing a first guess.',
  },
  'pick-the-same': {
    idea: 'When everyone gains by choosing alike, pick what stands out to everyone, not your favourite. To get a group to aim high, go first where all can see.',
    plays:
      'Four meet-ups with a crowd of bots and no way to talk, then eight hunts where a stag is caught only if all five hunters go for it.',
  },
  'first-number': {
    idea: 'A first number pulls your estimate towards it, even one that means nothing. So first give one reason it could be too high and one it could be too low.',
    plays:
      'Six estimates of rents, crowds and deadlines, each just after someone else’s first number. Then the same six again, after a reason each way.',
  },
  'who-moves-first': {
    idea: 'A threat is believable only if carrying it out pays the one who made it, when the time comes. A binding commitment can make it pay, and moving first can help.',
    plays:
      'Decide whether to open a tea stall beside three owners who threaten a price war, then own the stall and choose your first move against two rivals.',
  },
  'split-it-fairly': {
    idea: 'People turn down offers they find unfair, even at a cost to themselves. Trust grows what there is to share, and pays with those who pay it back.',
    plays:
      'Offer a share of 100 points to four bots who can say no, then send points that are tripled to two partners, then decide what to send back.',
  },
  'trade-what-matters-less': {
    idea: 'Give way on what matters less to you and more to them, and ask what they care about. Splitting every issue down the middle leaves points on the table.',
    plays:
      'Two job-offer talks over four issues at once (salary, joining date, days at home, training), against bots with hidden scoring sheets.',
  },
  'used-scooters': {
    idea: 'When the seller knows more, a fair average price drives good sellers away. Check for yourself, or ask for a promise that would cost a cheat dearly.',
    plays:
      'Nine days buying used scooters from sellers who know which are good: on price alone, then with a mechanic’s check, then with warranties.',
  },
  'guess-two-thirds': {
    idea: 'To beat a crowd, guess how far ahead the others think, and go one step further. Thinking no steps ahead loses, and so does thinking all the way.',
    plays:
      'Four rounds of picking a number from 0 to 100 against crowds of bots, each round won by the number closest to two-thirds of the average.',
  },
  'follow-the-queue': {
    idea: 'A long queue may rest on the tips of the first two or three people, with everyone after them just following. Ask why people chose, and weigh your own evidence.',
    plays:
      'Six streets with two new restaurants side by side. You get a friend’s tip and see where the people ahead of you went; then you choose.',
  },
};
