---
title: More than one guess
summary: When you cannot see what the other side holds, list what they could hold, act on what works across the list, and cross out what new facts rule out.
game: strategy
stage: 3
order: 1
skills: [read-hidden]
after: poker/ranges-and-equity
sources:
  - title: Chaalwise, our own writing; the poker numbers are worked out by packages/poker
    licence: own
steps:
  - kind: read
    id: on-the-board
    text: 'In this poker hand, played for points, you hold the king of hearts and the queen of clubs. With the king on the board, you have a pair of kings. Your opponent is careful and rarely bets big without a strong hand, and has just raised (bet more than you did). You cannot see their two cards. From how they play, they could hold a pair of eights, which makes three eights with the board; an ace and a king; or a king and a jack.'
    cards:
      hole: [Kh, Qc]
      board: [Ks, 8h, 3c, 2d]
  - ask: poker/more-than-one-guess/careful-raise
  - ask: poker/more-than-one-guess/compare
  - kind: read
    id: off-the-board
    text: 'What both share has a name: think in ranges, not one guess. A range is every hand, or every reason, the other side could have. When you cannot see what they hold, list what fits what you know, and roughly how likely each is. Choose what works across the list, not what is best against one guess. When new facts come, cross out what no longer fits, and weigh the rest again.'
  - ask: life/more-than-one-guess/silent-colleague
  - ask: life/more-than-one-guess/sample-paper
  - ask: life/more-than-one-guess/scooter
  - kind: plan
    id: plan
    prompt: 'Use it this week. When will you list what the other side could hold?'
    situations:
      - 'a reply, a silence or a price could mean more than one thing'
      - 'I prepare for a test, a meeting or an interview whose questions I cannot see'
      - 'someone changes an offer without saying why'
    action: 'I will list what could explain it, act on what works across the list, and cross out what new facts rule out'
---

A single guess is right only when it happens to be right. A list, weighed roughly, is right on average, and it shows which new fact would change your mind. The reference entry [Range](/reference/poker/range/) goes further.
