---
title: Patterns save thinking
summary: Learn the common shapes by heart, so the obvious answers come at once and your thinking goes where it is needed.
game: strategy
stage: 2
order: 1
skills: [calculate]
after: chess/rook-mate
steps:
  - kind: read
    id: on-the-board
    text: On the board, strong players do not work out the back-rank mate each time. They know the pattern, a king boxed in by its own pawns, and see the answer at once.
    position: 6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1
    highlight: [g8, f7, g7, h7]
  - kind: read
    id: off-the-board
    text: Off the board, every field has its patterns. Learn the common shapes by heart, so the obvious answers are instant and your effort goes to what is new.
  - kind: choice
    id: scam
    prompt: "A text says: 'Your bank account will be blocked today. Verify now at this link and tell us the code we send you.' Last month's scam text was about a parcel. What tells you most about this one?"
    options:
      - Its shape, a rush, a link and a request for a code
      - It reads nothing like the parcel text you saw
      - It names your own bank, and the number looks real
    answer: 0
    feedback:
      - ''
      - Comparing with the last scam feels sensible, but scams change their wording every time. The shape is what repeats.
      - A real bank name and a real-looking number are reassuring, but both are easy to fake. They do not change the shape of the request.
    explanation: A pattern is the shape, not one example. Urgency, a link and a request for a code mark a scam whatever the story; learn the shape and you will spot the next one, worded differently.
  - kind: choice
    id: cooking
    prompt: A new cook keeps burning onions, each time in a different recipe. What is the most useful thing for them to learn?
    options:
      - Onions catch over high heat once soft, so turn it down then
      - Follow each recipe's timings more closely
      - Watch the pan more closely every time they cook
    answer: 0
    feedback:
      - ''
      - Recipe timings help, but the recipes all differ and the onions burn in all of them. The cause is the same each time, so learn the cause.
      - Watching harder works, but it costs full attention every time. Knowing the moment onions catch frees that attention for the rest of the dish.
    explanation: Once the cause is a pattern you recognise, you stop solving the same problem every time.
  - kind: choice
    id: compare
    prompt: "What does spotting Rd8 mate share with the team lead's case?"
    position: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1'
    alongside: 'A team lead sees a third project this year slip in the same final week of testing.'
    options:
      - 'A known shape, seen at a glance, saves working it out'
      - 'Both are problems solved by thinking harder each time'
      - 'Both go wrong at the very end, so nothing can be done'
    answer: 0
    feedback:
      - ''
      - 'Thinking harder each time is what patterns spare you. The strong player and the alert lead both recognise the shape.'
      - 'The end is where it shows, not where it starts. Seen early, the pattern can be headed off.'
    explanation: 'The boxed-in king and the late slip are both shapes that repeat. Once you know the shape, you see it at once and spend your thinking on what is new.'
  - kind: plan
    id: plan
    prompt: 'Use it this week. When will you look for the pattern?'
    situations:
      - 'I notice a mistake I have made before'
      - 'a problem at work or in study feels familiar'
      - 'I check over a piece of work before handing it in'
    action: 'I will write down the shape it takes, so I see it coming next time'
---

Chess players get faster by learning patterns, not only by thinking harder. The same holds in any field you practise with quick, honest feedback, and patterns from one field rarely carry to another, so build them where you need them.
