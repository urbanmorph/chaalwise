import type { Lab } from './labs';

/** A plan to use a lab's idea away from the game, offered after its debrief, as a lesson's plan step is (see PlanStep). */
export interface LabPlan {
  /** "When will you …?", under the heading "Use it this week". */
  prompt: string;
  /** Each completes "When …", such as "a group estimates a cost". */
  situations: string[];
  /** Completes the sentence, such as "I will ask each person to write down their own answer first". */
  action: string;
}

/** Each lab's plan, by its slug. Kept apart from LABS, which lesson pages load to know which lab a question is from. */
export const LAB_PLANS: Record<Lab['slug'], LabPlan> = {
  'prisoners-dilemma': {
    prompt: 'When will you cooperate first, then answer in kind?',
    situations: [
      'a classmate or colleague I work with often asks for help',
      'someone I deal with again and again lets me down once',
      'I share chores or costs with a flatmate or a neighbour',
    ],
    action: 'I will start by helping, then do what they did last time, and forgive a single slip',
  },
  'rock-paper-scissors': {
    prompt: 'When will you check whether you are predictable?',
    situations: [
      'I am about to make the offer or the move I always make',
      'someone I compete or bargain with seems to know what I will do',
      'I set spot checks or surprise tests for others',
    ],
    action: 'I will ask how someone who knows my habit could use it, and vary my choice',
  },
  'sealed-bid-auction': {
    prompt: 'When will you check that you are not overpaying?',
    situations: [
      'I make an offer on something whose value is unclear',
      'I win a deal after a contest with other buyers',
      'I feel like paying more because others want it too',
    ],
    action: 'I will set my top price before I bid, and set it lower when many others are bidding',
  },
  nim: {
    prompt: 'When will you work backwards from the goal?',
    situations: [
      'I plan work that has a fixed deadline',
      'I prepare for an exam or an interview on a set date',
      'I plan a trip or an event whose steps must happen in order',
    ],
    action: 'I will start from the end and write each step before it, in turn',
  },
  'rule-finder': {
    prompt: 'When will you test whether you are wrong?',
    situations: [
      'I am sure why something went wrong',
      'I think I know what a customer, a teacher or a manager wants',
      'I check whether a change I made has worked',
    ],
    action: 'I will try one test that would come out differently if I were wrong',
  },
  'split-the-pie': {
    prompt: 'When will you work out both walk-away points?',
    situations: [
      'I ask for a raise, a discount or a better price',
      'I agree with someone how to split work or costs',
      'I am about to accept the first offer I get',
    ],
    action: 'I will write down what each side gets with no deal before I name a number',
  },
  'which-bag': {
    prompt: 'When will you start from how common something is?',
    situations: [
      'I judge a person or a plan from one striking detail',
      'I am about to back someone for more after a lucky run',
      'I guess the cause of a problem',
    ],
    action: 'I will ask how often this happens in general, then adjust for what I see',
  },
  'gain-or-loss': {
    prompt: 'When will you restate a choice the other way round?',
    situations: [
      'an offer is put as a saving or as a loss',
      'I am told what I will lose if I do not act now',
      'I choose between a sure thing and a risk',
    ],
    action: 'I will put it the other way round and check that my answer stays the same',
  },
  'bonus-rule': {
    prompt: 'When will you check what a rule rewards?',
    situations: [
      'I set a target or a reward for a team, a class or my family',
      'I am given a target and see a shortcut to meet it',
      'I write the marking scheme for a task',
    ],
    action: 'I will ask how someone could score on it cheaply, and close that gap',
  },
  'ask-the-panel': {
    prompt: 'When will you collect guesses before anyone speaks?',
    situations: [
      'a group estimates a cost, a time or a number',
      'a meeting is about to discuss a decision',
      'I ask friends what they think of a choice',
    ],
    action: 'I will ask each person to write down their own answer first, then compare them',
  },
  'pick-the-same': {
    prompt: 'When will you pick what stands out to everyone?',
    situations: [
      'a group has to meet up without a clear plan',
      'a team must choose one tool, one format or one time together',
      'I want a group to aim for a bigger goal',
    ],
    action: 'I will choose the option everyone would notice, or go first where all can see',
  },
  'first-number': {
    prompt: 'When will you question the first number you hear?',
    situations: [
      'someone names a price, a rent or a salary before I have worked out mine',
      'a team plans a job from the date someone hopes it will be done',
      'a form or a budget shows an example figure before I fill in my own',
    ],
    action:
      'I will give one reason the number could be too high and one it could be too low, then name my own number and why',
  },
  'who-moves-first': {
    prompt: 'When will you check whether a threat would really be carried out?',
    situations: [
      'someone says they will walk away, quit or go elsewhere if I do not agree',
      'a rival business says it will cut prices if I start selling near it',
      'I am about to warn someone what I will do if they do not change',
    ],
    action: 'I will ask whether doing it would pay them, or me, when the time comes, and believe it only if it would',
  },
  'split-it-fairly': {
    prompt: 'When will you make an offer the other side will see as fair?',
    situations: [
      'I split work, credit or money with someone who can say no',
      'someone I will deal with again trusts me with something',
      'I decide how far to trust a new partner, colleague or tenant',
    ],
    action:
      'I will offer a share they can accept with pride, and trust in small steps, giving more to those who pay it back',
  },
  'trade-what-matters-less': {
    prompt: 'When will you trade across issues instead of splitting each one?',
    situations: [
      'I talk through a job offer, a joining date or a raise',
      'I agree a deal with a supplier or a client that has several parts',
      'I share out chores, shifts or tasks with others',
    ],
    action:
      'I will ask what matters most to them, and give way on what matters less to me in return for what matters more',
  },
  'used-scooters': {
    prompt: 'When will you check what the other side knows and you do not?',
    situations: [
      'I buy something second-hand, from a phone to a scooter',
      'I hire someone or choose a supplier I have not used before',
      'a deal looks cheap and the seller knows more about it than I do',
    ],
    action: 'I will pay for a check, or ask for a promise that would cost them if they were wrong, such as a warranty',
  },
};
