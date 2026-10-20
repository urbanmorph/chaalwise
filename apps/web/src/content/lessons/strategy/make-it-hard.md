---
title: Make it hard
summary: When you are behind, do not give in early. Find the defence that leaves the other side the most to get right.
game: strategy
stage: 7
order: 6
skills: [composure]
after: chess/endgame-intro
steps:
  - kind: read
    id: on-the-board
    text: On the board, being far behind is not the same as losing. Here Black is a queen for a pawn down, and many would resign. Yet Kb1 or Ka1 holds the draw, keeping the king in the corner by its pawn; any other king move loses. With Black's king on a1, in front of its pawn, a queen move that takes its last square without check is stalemate.
    position: 6K1/8/8/3Q4/8/8/pk6/8 b - - 0 1
    highlight: [a1, a2, b2]
  - kind: move
    id: hold-on
    prompt: Black is a pawn down and could easily lose. Only one move holds the draw. Find it.
    position: 2k5/8/8/3K4/3P4/8/8/8 b - - 0 1
    orientation: black
    measures: endgame
    answers: [c8d7]
    hint: Face White's king with one square between, and leave White to move.
    explanation: Kd7 takes the opposition. The kings face each other with one square between, and White must move. White's king cannot get past, and the game is drawn. Every other move loses.
  - kind: read
    id: off-the-board
    text: Off the board, when things go badly, the pull is to give in early, by taking the first offer, dropping the bid or leaving a hard answer blank. Instead, ask what would make the result hardest to lose, and do that. This is not refusing ever to stop. When something is truly lost, stop, but find out first.
  - kind: choice
    id: dearer-bid
    prompt: Your firm is bidding for a contract against a larger rival, and the client says your price is 15% higher. They will decide in a week. What do you do?
    options:
      - Make the case on what you do better than the rival
      - Withdraw now, as the rival is clearly ahead
      - Cut your price by 15% to match the rival
    answer: 0
    feedback:
      - ''
      - Behind is not lost. Withdrawing hands the rival the contract without making them earn it.
      - Matching on price plays the rival's strongest card, and takes 15% off your margin on a contract you may still lose.
    explanation: Make the rival prove they are better, on the points where you are strong, such as service, speed or what the whole contract costs to run. Price is one figure in the client's choice, not all of it.
  - kind: choice
    id: last-question
    prompt: With 15 minutes left in a maths exam, you see that you cannot fully solve the last question, worth 20 marks. What do you do?
    options:
      - Write every step you can, for the method marks
      - Leave it blank and check your earlier answers
      - Write a guess at the final answer and stop
    answer: 0
    feedback:
      - ''
      - Checking is useful, but a blank page scores nothing, and a 20-mark question usually rewards the method too.
      - A bare answer earns little if it is wrong, and shows nothing of how you got there.
    explanation: Most exams give marks for method. Partial work gives the examiner something to credit; a blank gives up marks that were there to take.
  - kind: choice
    id: compare
    prompt: A queen down, Black keeps the king in the corner and draws. What does that share with the bid?
    position: 6K1/8/8/3Q4/8/8/pk6/8 b - - 0 1
    alongside: A small firm, 15% dearer than a larger rival, has a week before the client decides.
    options:
      - Behind is not lost, so make the other side prove it
      - Both are about holding on to the last of what you have
      - Both are hopeless, so it is wise to give up early
    answer: 0
    feedback:
      - ''
      - Holding on is the surface. The king does not cling to the pawn for its own sake; it picks the defence that is hardest to beat.
      - Neither is hopeless. The position is a draw with care, and the bid can still be won on more than price.
    explanation: Black finds the defence that leaves White no way through. The firm makes the rival win on every point, not just price. In both, being behind is a reason to defend well, not to stop.
  - kind: plan
    id: plan
    prompt: 'Use it this week. When will you make it hard?'
    situations:
      - 'something I am working on starts to go badly'
      - 'I feel like giving up on a task or a test answer'
      - 'I am behind in a negotiation or a competition'
    action: 'I will find the one step that makes the result hardest to lose, and take it'
---

Chess teaches this because lost-looking games are often saved by stubborn, accurate defence. Off the board, the habit comes only from practising it there, as this week's task asks.
