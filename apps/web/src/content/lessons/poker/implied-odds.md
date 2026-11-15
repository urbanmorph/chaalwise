---
title: Odds for later
summary: Count what you could win on later rounds, not only what is in the pot now, and when not to.
game: poker
stage: 2
order: 3
skills: [weigh-odds]
steps:
  - kind: read
    id: more-to-come
    text: 'Pot odds compare what a call costs with the points in the pot now. But if you make your hand, you may win more points on the betting rounds still to come. Those later winnings are your implied odds. They let you call a little more than the pot alone pays for. That holds only if the other player will keep paying when your card comes, and the better hidden your hand, the more they will pay. It also works the other way. If your hand can come in and still lose, as with a low flush when a higher flush is possible, making it can cost you more later.'
    cards:
      hole: [Ah, 5h]
      board: [Kh, 9h, 2c, 7s]
      pot: 10
      toCall: 4
  - ask: poker/implied-odds/paid-later
  - ask: poker/implied-odds/obvious-draw
  - ask: poker/implied-odds/careful-opponent
  - ask: life/odds-for-later/course
  - kind: plan
    id: plan
    prompt: 'Use it away from the table this week. When will you count what could come later?'
    situations:
      - 'I decide whether to take a small first step that could lead to more'
      - 'someone promises more work or business later if I agree now'
      - 'I weigh a low-paid start against where it could lead'
    action: 'I will count the later gain only if they are likely to deliver it'
---

Implied odds are the later winnings a hit can bring. Count them only when the other side will really pay.
