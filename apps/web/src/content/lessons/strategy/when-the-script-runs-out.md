---
title: When the script runs out
summary: Prepared plans run out. When they do, act on the reasons behind them.
game: strategy
stage: 3
order: 2
skills: [plan-long]
after: chess/opening-map
steps:
  - kind: read
    id: on-the-board
    text: On the board, players learn opening lines by heart, and opponents often leave them early. Here Black answers 1.e4 with ...a6, a move few repertoires cover. The memorised lines are no help now. The reasons behind them still are. Take the centre, bring out the pieces, castle.
    position: 'moves: e4 a6'
    highlight: [a6]
  - kind: move
    id: reasons-not-lines
    prompt: Black has left your prepared lines with ...h6. You still know what the opening is for. Your knight and bishop are out, so make your king safe.
    position: 'moves: e4 e5 Nf3 Nc6 Bc4 h6'
    measures: opening
    answers: [e1g1]
    hint: The squares between your king and the rook on h1 are empty now.
    explanation: Castling tucks the king away and brings the rook towards the centre. You needed no line for ...h6, only the reasons every opening follows.
  - kind: read
    id: off-the-board
    text: Off the board, scripts are prepared lines. A sales pitch, a model answer, the way it was done last time. They work while things go as expected. When the other side does something new, do not force the script. Ask what it was for, and act on that reason.
  - kind: choice
    id: pitch
    prompt: You prepared a pitch for a client's finance head, built around cutting their costs by 20%. Ten minutes in, she says costs are fine; their problem is that staff keep leaving. What do you do?
    options:
      - Finish the pitch, since the 20% saving may win her round
      - Ask what staff turnover costs them, and how you could help
      - Offer a bigger discount to keep her interested
    answer: 1
    feedback:
      - The pitch was built for a problem she says she does not have. Pushing on is playing your memorised line after the opponent left it.
      - ''
      - A discount answers a worry about cost, which she has just told you is not the issue.
    explanation: The pitch was a way to help her business. That reason still holds when the script does not, so find out what her real problem costs, and answer that.
  - kind: choice
    id: exam-question
    prompt: You learned to solve equations by following worked examples. In the exam, a question worth 12 of the 80 marks looks like none of them. What do you do first?
    options:
      - Copy the method of the nearest example and adjust it
      - Skip it, since you could not prepare for everything
      - Work out what the question asks and which rules apply
    answer: 2
    feedback:
      - The nearest example looks alike, but it may solve a different problem. Forcing its steps is how a memorised line goes wrong.
      - 12 of 80 marks is 15% of the paper. Skipping gives up all of it, when the rules you know may get you most of the way.
      - ''
    explanation: The examples were there to teach the rules. When none fits, go back to what the question asks, and use the rules directly.
  - kind: choice
    id: compare
    prompt: "What does facing 1...a6 share with the customer's new question?"
    position: 'moves: e4 a6'
    alongside: 'A call-centre script ends, and the customer asks something it never covered.'
    options:
      - 'The plan has run out, but the reasons behind it still guide you'
      - 'Both happen in the first minute of an exchange'
      - 'Both call for a longer script that covers more cases'
    answer: 0
    feedback:
      - ''
      - 'When it happens is a surface likeness. What they share is that the prepared lines stop, and the purpose does not.'
      - 'No script covers everything, because opponents and customers always find something new. The reasons are what carry over.'
    explanation: 'In both, the prepared lines have ended. On the board, take the centre and develop; on the call, help the customer with what they need. The purpose outlasts the script.'
  - kind: plan
    id: plan
    prompt: 'Use it this week. When will you go back to the reason?'
    situations:
      - 'a meeting or call leaves my prepared plan'
      - 'a question is worded in a way I have not seen'
      - 'a routine I follow stops working'
    action: 'I will ask what the plan was for, and act on that reason'
---

Opening principles are what is left when the memorised moves run out. Off the board, going back to the reason becomes a habit only if you practise it there too, as this week's task asks.
