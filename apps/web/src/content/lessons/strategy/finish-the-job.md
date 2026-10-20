---
title: Finish the job
summary: A winning position is not a win until it is finished. The last steps need as much care as the first.
game: strategy
stage: 7
order: 5
skills: [plan-long]
after: chess/endgame-intro
steps:
  - kind: read
    id: on-the-board
    text: On the board, a queen up is a won game, until the last move. Here Qb7 is mate. Qb6, which looks just as strong, takes every square from Black's king without giving check. That is stalemate, and the game is a draw.
    position: k7/8/2K5/8/8/8/8/1Q6 w - - 0 1
    highlight: [b6, b7]
  - kind: move
    id: last-step
    prompt: The pawn is one step from queening. Only one move wins. Find it.
    position: 8/kP6/2K5/8/8/8/8/8 w - - 0 1
    measures: endgame
    answers: [c6c7]
    hint: If you queen now, can Black's king take the new queen?
    explanation: Kc7 guards b8. Black's king must step back to a6, and the pawn queens next move. Queening at once lets Black's king take the new queen, and with nothing left, it is a draw.
  - kind: read
    id: off-the-board
    text: Off the board, work that is nearly done is the easiest to spoil. The last steps, such as checking the figures, sending the right version or getting the signature, are where people relax. Keep the same care to the end, and before each last step, ask what could still go wrong.
  - kind: choice
    id: contract
    prompt: After three months, a client has agreed every term of a large contract by phone. The signed copy is due on Friday. It is Thursday afternoon. What do you do?
    options:
      - Check the final copy against what was agreed, then send it
      - Send it straight away, since everything is agreed
      - Celebrate with the team now; Friday is a formality
    answer: 0
    feedback:
      - ''
      - Agreed is not signed. A wrong figure or an old version in the copy can reopen three months of talks.
      - The work feels finished, but nothing is signed. Relaxing before the last step is how won positions are drawn.
    explanation: The deal is won but not finished. One careful check of the final copy costs an hour; a mistake at this stage can cost the deal.
  - kind: choice
    id: essay
    prompt: Your essay is written, two hours before the deadline. Last time you lost 10 marks for a missing reference list. What do you do with the two hours?
    options:
      - Check it against the mark scheme, then submit
      - Submit now, before anything can go wrong
      - Rewrite the opening, which you never liked
    answer: 0
    feedback:
      - ''
      - Submitting early feels safe, but the risk is already in the file. Last time, a missing list cost 10 marks.
      - Starting a new change at the end opens new ways to go wrong, with no time left to check them.
    explanation: The last step is a check, not a new move. Last time, the 10 marks were lost at the finish, not in the writing.
  - kind: choice
    id: compare
    prompt: Kc7 before queening wins; queening at once draws. What does that share with the contract?
    position: 8/kP6/2K5/8/8/8/8/8 w - - 0 1
    alongside: A sales team has agreed every term of a contract, and the signed copy is due tomorrow.
    options:
      - The last step needs care, even when the win looks sure
      - Both are about promoting what you have built
      - Both are settled once the hard part is done
    answer: 0
    feedback:
      - ''
      - Promotion is the surface, a pawn becoming a queen. The contract shares the moment, not the word.
      - That is the mistake both warn against. The hard part is done in both, and the last step can still throw it away.
    explanation: One careless move turns the won pawn ending into a draw. One unchecked copy can reopen a finished deal. In both, slow down at the last step.
  - kind: plan
    id: plan
    prompt: 'Use it this week. When will you finish the job with care?'
    situations:
      - 'a piece of work is nearly done and I want it gone'
      - 'a deal, an application or a form is ready to send'
      - 'I am about to hand in an assignment'
    action: 'I will name what could still go wrong, and check that first'
---

Chess punishes a careless finish at once, with stalemate or a lost pawn. Off the board, careful finishing becomes a habit only if you practise it there, as this week's task asks.
