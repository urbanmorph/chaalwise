---
title: Basics before brilliance
summary: Get the plain, sound steps right first. Clever ideas pay on top of them, not instead of them.
game: strategy
stage: 3
order: 1
skills: [plan-long]
after: chess/three-phases
steps:
  - kind: read
    id: on-the-board
    text: On the board, the opening rewards plain good moves. Bring out a piece, take the centre, castle. Here White brought the queen out early to aim at f7. Black met each threat with a useful move, ...g6 to make room for the bishop and ...Nf6 to develop. Now Black has both knights out, while White's queen has moved twice and is a target.
    position: 'moves: e4 e5 Qh5 Nc6 Bc4 g6 Qf3 Nf6'
    highlight: [f3, c6, f6]
  - kind: move
    id: develop-with-time
    prompt: Black's queen came out early and took on d5. Bring out a piece and attack the queen with it.
    position: 'moves: e4 d5 exd5 Qxd5'
    measures: opening
    answers: [b1c3]
    hint: Which knight can reach a square that attacks d5?
    explanation: Nc3 develops a knight and makes the queen move again, so White gains time. Bc4 also attacks the queen, but nothing guards the bishop, and ...Qxc4 takes it.
  - kind: read
    id: off-the-board
    text: Off the board, the same holds when you start something new. The plain steps, done well, beat clever shortcuts. A clever plan that skips the basics works only if nobody does the basics against you. Get the groundwork right first.
  - kind: choice
    id: new-team
    prompt: You start as the manager of a team of six. Two of them missed deadlines last month because nobody tracks who is doing what. Your director wants a bold idea for next year within a month. What do you do first?
    options:
      - Draft the bold idea, since the director asked for it
      - Set up a weekly list of who is doing what, by when
      - Hire a seventh person to cover the missed work
    answer: 1
    feedback:
      - The idea matters, but a team that misses deadlines cannot deliver it. It is the queen out before the pieces.
      - ''
      - A seventh person does not fix a tracking problem. They join the same confusion.
    explanation: The missed deadlines come from a missing basic. Fix that first, and the bold idea has a team that can deliver it.
  - kind: choice
    id: mock-exam
    prompt: Your maths exam is in six weeks. In the mock, you lost 30 of 100 marks to slips with fractions and signs, and 10 on the two hardest questions. How do you spend most of your revision?
    options:
      - Practise the hardest questions until you can solve them
      - Drill fractions and signs until the slips stop
      - Learn shortcut tricks that save time in the exam
    answer: 1
    feedback:
      - The hardest questions cost you 10 marks; the slips cost 30. Solving hard ones feels like progress, but the marks are in the basics.
      - ''
      - Tricks save time only when the working is sound. With slips in the basics, faster working makes more slips.
    explanation: 30 marks lost to the basics against 10 to the hardest questions. Fixing the basics is worth three times as much, and it helps every question on the paper.
  - kind: choice
    id: compare
    prompt: "What does White's early queen share with the launch video?"
    position: 'moves: e4 e5 Qh5 Nc6 Bc4 g6 Qf3 Nf6'
    alongside: 'A new start-up spends its first month on a launch video before the product works.'
    options:
      - 'Going for the clever part before the groundwork is done'
      - 'Both are about showing off to the other side'
      - 'Both show that you should never take a risk'
    answer: 0
    feedback:
      - ''
      - 'Showing off is a surface likeness. The real problem is what was skipped: pieces out in chess, a working product here.'
      - 'Risk is not the trouble. A bold idea can be right, once the basics under it are in place.'
    explanation: "White's queen went hunting before the other pieces were out, and the start-up went for the launch before the product worked. In both, the clever part rests on groundwork that is not there."
  - kind: plan
    id: plan
    prompt: 'Use it this week. When will you do the basics first?'
    situations:
      - 'I start a new job, role or project'
      - 'I am tempted by a clever shortcut'
      - 'I plan my revision or practice'
    action: 'I will list the basic steps it needs, and get them right before anything clever'
---

Opening principles are the basics of chess. Off the board, doing the basics first becomes a habit only if you practise it there too, as this week's task asks.
