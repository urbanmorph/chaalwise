---
title: Count it through
summary: Follow a chain of consequences to the end before you agree to the first step.
game: strategy
stage: 1
order: 1
skills: [calculate]
after: chess/safe-moves
steps:
  - kind: read
    id: on-the-board
    text: On the board, before a capture, you follow every capture on that square to the end. Who is ahead when the captures stop? Here exd5 exd5 leaves White a knight for a pawn up.
    position: 4k3/8/4p3/3n4/4P3/8/8/4K3 w - - 0 1
    highlight: [d5]
  - kind: read
    id: off-the-board
    text: Off the board, many offers look good at the first step. Count the whole chain, to where it stops, before you agree.
  - kind: choice
    id: gym
    prompt: A gym gives you the first month free if you then sign a 12-month contract at 1,500 a month, which cannot be ended early. You expect to stop going after about three months. What does saying yes commit you to?
    options:
      - 'Nothing at first: the first month is free'
      - '3,000: the two paid months you will use'
      - '18,000: the whole contract'
    answer: 2
    feedback:
      - The free month is real, but it is only the first capture. Signing is what the free month is for, and the contract follows it.
      - That counts what you expect to use, not what you sign for. The contract cannot be ended early, so you pay for all twelve months.
      - ''
    explanation: 'The free month is the first capture; the contract is the recapture. 12 × 1,500 = 18,000, whether you go or not. Judge where the sequence ends.'
  - kind: choice
    id: bulk-offer
    prompt: A bottle of sauce costs 120, or you can have three for the price of two. You will finish one bottle before the others go off. What does the offer do for you?
    options:
      - It saves you 120, the price of the free bottle
      - It saves you 40 on each bottle
      - It costs you 120 more than you need to spend
    answer: 2
    feedback:
      - The third bottle is free only if you would have bought it anyway. You would not, so nothing is saved.
      - Each bottle is cheaper, but you pay for bottles you will throw away. The price per bottle is the first step, not the end.
      - ''
    explanation: You pay 240 for three bottles to use one that costs 120 on its own. Counted through, the deal costs you twice what you needed to spend.
  - kind: choice
    id: compare
    prompt: 'What do the captures on d5 and the phone offer share?'
    position: '4k3/8/4p3/3n4/4P3/8/8/4K3 w - - 0 1'
    alongside: 'A phone shop offers a free handset with a two-year contract.'
    options:
      - 'The first step looks good; only the end of the chain tells'
      - 'Both are a free gain that should be taken at once'
      - 'Both are about counting what you have right now'
    answer: 0
    feedback:
      - ''
      - 'Neither is free. The handset is paid for by the contract, just as a capture can be paid for by the recapture.'
      - 'Counting what you have now misses what follows. Both need counting to the end of the chain.'
    explanation: 'A capture and an offer both start with something that looks like a gain. Follow every step to where it stops, then judge.'
  - kind: plan
    id: plan
    prompt: 'Use it this week. When will you count a chain through?'
    situations:
      - 'an offer looks good at first sight'
      - 'I am asked to take on a new commitment'
      - 'I am about to sign up for something with a free start'
    action: 'I will write down every step that follows, and its cost, before I say yes'
---

Calculation in chess is counting a sequence to the end. Off the board, the counting becomes a habit only if you practise it there too, as this week's task asks.
