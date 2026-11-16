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
  'guess-two-thirds': {
    prompt: 'When will you ask how far ahead the others are thinking?',
    situations: [
      'I set a price and my rivals may answer it',
      'I choose a day or a time that many others are choosing too',
      'everyone has heard the same tip, such as which day is quietest',
    ],
    action: 'I will guess what most of them will do, then go one step beyond that, not all the way',
  },
  'follow-the-queue': {
    prompt: 'When will you ask why the crowd chose what it chose?',
    situations: [
      'I pick a restaurant, a course or a product because many others have',
      'a group agrees one after another, each after hearing the ones before',
      'my own evidence points one way and the crowd goes the other',
    ],
    action: 'I will ask a few people why they chose, count only the reasons of their own, and add my evidence to them',
  },
  'shared-fund': {
    prompt: 'When will you help a group keep a shared thing going?',
    situations: [
      'a group project has members who do little of the work',
      'a group chat splits shared bills, such as a trip or a party',
      'a common area, such as a kitchen at work or a hostel corridor, is left in a mess',
    ],
    action:
      'I will make what each person gives easy to see, give first myself, and ask the group to agree a simple rule with a small cost for breaking it',
  },
  'who-backs-down': {
    prompt: 'When will you weigh a stand-off before you dig in?',
    situations: [
      'two teams claim the same meeting room, budget or deadline',
      'a rival shop or firm starts a price war',
      'a family or flat dispute over a shared room, car or plot drags on',
    ],
    action:
      'I will compare what the fight would cost us both with what is at stake, and offer a way out that lets either side give way without losing face',
  },
  'who-sets-the-agenda': {
    prompt: 'When will you check who set the order of the votes before you vote?',
    situations: [
      'a committee, a society or a club votes on several options, two at a time',
      'a panel draws up a shortlist for a hire or an award',
      'my family or friends choose a holiday or a plan from several ideas',
    ],
    action:
      'I will ask who chose the order and the shortlist, what would win in another order, and how the last vote will go before I cast the first',
  },
  'fair-shares': {
    prompt: 'When will you split by what each person adds?',
    situations: [
      'I share a cab or an auto with people getting off at different stops',
      'a team I am in splits a bonus, a prize or the credit for a project',
      'friends and I split a delivery charge on a joint order',
    ],
    action:
      'I will work out what each person adds, check that no one and no pair would do better on their own, and propose that split',
  },
  'wait-them-out': {
    prompt: 'When will you set a stop point before a stand-off?',
    situations: [
      'two of us both want the same post, slot or job, and each waits for the other to give up',
      'a dispute with a landlord, a firm or a neighbour drags on and costs us both each week',
      'I hear myself say we have spent too long on this to give in now',
    ],
    action:
      'I will write down before it starts how many weeks it is worth to me, and ask each week only whether the next one is worth it',
  },
};
