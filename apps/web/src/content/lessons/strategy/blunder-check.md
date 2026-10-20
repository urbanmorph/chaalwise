---
title: The blunder check
summary: Before you act, ask what could go wrong, and look at what the other side can do first.
game: strategy
stage: 1
order: 1
skills: [think-ahead]
after: chess/blunder-check
steps:
  - kind: read
    id: on-the-board
    text: On the board, before every move, you look at checks, captures and threats, theirs first. Here the knight on c3 attacks the queen. Missing that is how many games are lost.
    position: 4k3/8/8/8/8/2n5/8/3QK3 w - - 0 1
    highlight: [c3, d1]
  - kind: read
    id: off-the-board
    text: Off the board it is the same habit. Before you act, ask what could go wrong. Look first at what the other side, or the situation, can do to you, and only then at what you want to do.
  - kind: choice
    id: angry-email
    prompt: A colleague took credit for your work in the team chat. You have written a sharp reply to everyone and your finger is on Send. What do you do first?
    options:
      - Read it as they will, and ask what happens if it is forwarded
      - Check that every fact in it is right, then send it
      - Send it now, while the point is still fresh
    answer: 0
    feedback:
      - ''
      - Getting the facts right feels careful, but it only checks the move you want to make. The danger is in their reply, and in who else reads it.
      - Speed feels like strength here, but a sharp message sent in a hurry is the move most likely to be used against you.
    explanation: Their reply is the threat. Checking your facts is about your own move; the check is about what they, and anyone they forward it to, can do next.
  - kind: choice
    id: phone-plan
    prompt: 'Plan A costs 199 a month for the first year, then 649 a month, on a two-year contract. Plan B costs 399 a month throughout. Over the two years, which costs less?'
    options:
      - Plan A, because the first year saves 2,400
      - Plan B, by 600 over the two years
      - They come to about the same over two years
    answer: 1
    feedback:
      - The first-year saving is real, but it is the part you were meant to look at. The second year costs 3,000 more than Plan B and wipes it out.
      - ''
      - Plan A's two prices average 424, which looks close to 399, but 25 a month more over 24 months is 600.
    explanation: 'Plan A is 12 × 199 + 12 × 649 = 10,176. Plan B is 24 × 399 = 9,576. Like a piece left hanging, the danger is in the part you are not looking at: what happens after the offer ends.'
  - kind: plan
    id: plan
    prompt: 'Use it this week. When will you pause before acting?'
    situations:
      - 'I am about to send an important email or message'
      - 'I am about to agree to a deadline or a price'
      - 'I am about to hand in an essay or a piece of work'
    action: 'I will name one thing that could go wrong, and what I would do about it'
---

In chess the blunder check becomes a habit because you run it every move. Off the board it becomes one only if you practise it there too, as this week's task asks.
