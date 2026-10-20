---
title: A plan, step by step
summary: Turn a goal into a route of small steps, each worth having on its own, and look again after each one.
game: strategy
stage: 5
order: 4
skills: [plan-long]
after: chess/middlegame-intro
steps:
  - kind: read
    id: on-the-board
    text: On the board, a plan is a goal and a route to it. Here White wants a knight on d5, a strong central square that Black's pawns cannot easily attack. It takes two steps, Nc3 and then Nd5. After each step White looks again, because Black moves too.
    position: 4r1k1/1p2bppp/p2p4/4p3/4P3/8/PPP2PPP/1N2R1K1 w - - 0 1
    highlight: [b1, c3, d5]
  - kind: move
    id: first-step
    prompt: "White's plan: take the only open file with a rook, then go to the seventh rank, where Black's pawns stand. Make the first step."
    position: r4rk1/ppp2ppp/8/4p3/4P3/8/PPP2PPP/R4RK1 w - - 0 1
    measures: planning
    answers: [a1d1, f1d1]
    hint: Which file has no pawns on it?
    explanation: Rad1 or Rfd1 takes the d-file. Next, the other rook can double behind it, then one goes to d7. Each step is useful on its own, and if Black fights for the file, White looks again.
  - kind: read
    id: off-the-board
    text: Off the board, a goal is not yet a plan. Break it into steps you can take one at a time, each worth having even if the rest changes. After each step, look again, because the situation moves too.
  - kind: choice
    id: month-end
    prompt: Your team takes 10 working days to close the accounts each month. You want it down to 5 within six months. Which plan is most likely to get there?
    options:
      - Change one stage a month, and count the days after each
      - Switch every stage to a new process at once next month
      - Set the 5-day target now and leave the team to find a way
    answer: 0
    feedback:
      - ''
      - One big switch feels decisive, but if the close then takes longer, you cannot tell which change caused it, and nothing works well while it all beds in.
      - A target is the goal, not the route. Without steps, there is nothing to check along the way until the six months are gone.
    explanation: Six months give room for six changes, each one checked. A day saved is kept even if a later change fails, and a change that does not help shows at once.
  - kind: choice
    id: exam-weeks
    prompt: Your exam is in 7 weeks and covers 12 chapters. You want the last week free for revision. How do you plan the time?
    options:
      - Two chapters a week, with a short self-test each Sunday
      - Read all twelve once quickly, then go back over them
      - Start with the hardest chapters and see how far you get
    answer: 0
    feedback:
      - ''
      - A quick first pass feels like progress, but nothing tells you that you are behind until week six.
      - Hard chapters first is a fair idea, but with no pace set, you learn how far you got only when the time is gone.
    explanation: Twelve chapters in six weeks is two a week. The Sunday test is the look after each step. If a week slips, you know at once, and can change the plan while there is time.
  - kind: choice
    id: compare
    prompt: White wants a knight on d5 and goes there through c3. What does that share with the shop?
    position: 4r1k1/1p2bppp/p2p4/4p3/4P3/8/PPP2PPP/1N2R1K1 w - - 0 1
    alongside: A manager wants a second shop open within a year.
    options:
      - A goal reached in steps, each one worth having
      - Both are about taking a strong new position
      - Both are best done in one bold move, straight away
    answer: 0
    feedback:
      - ''
      - A strong square and a new shop sound alike, but that is the surface. What they share is the route, steps you can check one at a time.
      - The knight cannot reach d5 in one move, and a shop does not open in one step either. Each needs a route, and a look after each step.
    explanation: Nc3 then Nd5 is a route to a goal. The shop is the same. Find the site, sign the lease, hire the staff, each a step that is useful on its own, with a look after each one.
  - kind: plan
    id: plan
    prompt: 'Use it this week. When will you turn a goal into steps?'
    situations:
      - 'I set a goal for a project at work'
      - 'I start revising for a test or an exam'
      - 'I plan a change at home, such as a budget or a routine'
    action: 'I will write the first three steps, and the day I will check the plan still fits'
---

Middlegame plans in chess are practice in moving towards a goal one step at a time. Off the board, the habit grows only if you practise it there too, as this week's task asks.
