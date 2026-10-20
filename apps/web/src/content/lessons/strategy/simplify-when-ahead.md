---
title: Simplify when ahead
summary: When you are ahead and a sure win is what you need, remove the moving parts that could still go wrong.
game: strategy
stage: 5
order: 2
skills: [size-risk]
after: chess/middlegame-intro
steps:
  - kind: read
    id: on-the-board
    text: On the board, White is a knight ahead. Black's rook is its only active piece, and it threatens ...Rxe1 mate. Rxe8+ Kxe8 answers the threat and trades off that rook. With nothing left to attack with, Black cannot stop the extra knight from deciding the game.
    position: 4rk2/pp3ppp/8/8/8/2N5/PP3PPP/4R1K1 w - - 0 1
    highlight: [e1, e8]
  - kind: move
    id: trade-queens
    prompt: You are a knight ahead, and the queens face each other. Make the trade that leaves Black nothing to attack with.
    position: 6k1/pp3ppp/8/4p3/3q4/2N5/PP1Q1PPP/6K1 w - - 0 1
    measures: endgame
    answers: [d2d4]
    hint: Black's queen is guarded once. Take it anyway.
    explanation: Qxd4 exd4 trades queens. The knight then steps away from the pawn, and White has a knight against no pieces, with no danger to the king. Moving your queen away keeps Black's queen in play, free to give checks, and offering the trade elsewhere lets Black say no.
  - kind: read
    id: off-the-board
    text: Off the board, when you are ahead and a sure, modest win is worth more than a bigger, riskier one, remove what could still go wrong. Fewer moving parts, fewer surprises. This is not cashing in every gain early. It fits when you only need to finish, as with a deadline, a pass mark or a deal you only need to close.
  - kind: choice
    id: contract
    prompt: A client has agreed to sign your contract for 1,000,000 next week. Your team suggests adding a feature you have never built, which would raise it to 1,200,000. A late delivery would let the client cancel. What do you do?
    options:
      - Add the feature, since 200,000 more is worth the effort
      - Sign the contract as agreed
      - Sign, and promise the feature as a free extra
    answer: 1
    feedback:
      - The extra 200,000 is real, but untested work puts the whole 1,000,000 at risk of a late delivery.
      - ''
      - A free promise adds the same untested work and the same risk of being late, and earns nothing for it.
    explanation: You are ahead, and the deal is won. Adding untested work risks 1,000,000 to chase 200,000. Close the sure deal, and offer the feature later as its own project.
  - kind: choice
    id: deposit
    prompt: You have saved 290,000 of the 300,000 deposit you need for a flat in six months. A friend suggests moving the savings into shares, which might rise 20% by then, or fall as much. What do you do?
    options:
      - Move it all into shares for the faster growth
      - Keep it in a safe savings account
      - Move half into shares to balance the risk
    answer: 1
    feedback:
      - A 20% rise is welcome, but you only need 10,000 more. A 20% fall would leave you 68,000 short of the deposit.
      - ''
      - Half in shares still risks a 29,000 fall, when you only need 10,000 more. It halves the risk; it does not remove it.
    explanation: You are nearly there, and money above the deposit matters little to you. Simplify. Keep the money safe, and save the last 10,000.
  - kind: choice
    id: compare
    prompt: "What do Rxe8+ and the team's choice share?"
    position: 4rk2/pp3ppp/8/8/8/2N5/PP3PPP/4R1K1 w - - 0 1
    alongside: 'A week before a fixed deadline, with the work done, a team is offered a new tool that might make it faster.'
    options:
      - 'When ahead, remove what could still go wrong'
      - 'Both are about swapping one thing for another'
      - 'Always cash in a gain as early as you can'
    answer: 0
    feedback:
      - ''
      - 'Swapping is the surface likeness. The point is why: fewer moving parts, when a sure result is all you need.'
      - 'Cashing in every gain early is a known mistake. Simplify when a sure, modest win is what you need, as with the extra knight or the fixed deadline.'
    explanation: "White trades off Black's only active piece, and the team keeps the tools it knows a week before the deadline. Both are ahead, and both remove what could still go wrong."
  - kind: plan
    id: plan
    prompt: 'Use it this week. When will you simplify?'
    situations:
      - 'I am close to finishing work with a fixed deadline'
      - 'a plan that is working gets a new, untested extra'
      - 'I already have enough to meet the target'
    action: 'I will drop the extra moving parts and finish the sure part first'
---

Turning an advantage into a win is an endgame skill. Off the board, knowing when to simplify, and when not to, comes only with practice there too, as this week's task asks.
