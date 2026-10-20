---
title: Look at three before choosing
summary: Before you choose, name at least three options, including one you had not first thought of, and compare them.
game: strategy
stage: 7
order: 3
skills: [calculate]
after: chess/endgame-intro
steps:
  - kind: read
    id: on-the-board
    text: On the board, strong players do not play the first good-looking move. They name a few candidates, then compare them. Here White might attack f7 with Ng5, open the centre with d4, or play the quiet d3. Each leads to a different game.
    position: 'moves: e4 e5 Nf3 Nc6 Bc4 Nf6'
    highlight: [g5, d4, d3]
  - kind: move
    id: three-candidates
    prompt: Three moves catch the eye, Rxa7, Nc5 and Nf6+. Only one wins. Compare them, then play it.
    position: 6k1/p2q4/8/8/4N3/8/8/R5K1 w - - 0 1
    measures: calculation
    answers: [e4f6]
    hint: Which move attacks two things at once?
    explanation: Nf6+ checks the king and attacks the queen. After the king moves, Nxd7 wins it. Rxa7 loses the rook to Qxa7, and Nc5 attacks the queen, but it simply moves away.
  - kind: read
    id: off-the-board
    text: Off the board, decisions often arrive as a yes or a no, take the offer or not. Before you choose, name at least three options, including one you had not first thought of. Then compare them on the same points. Decisions weighed as a single yes or no go wrong more often than those with several options.
  - kind: choice
    id: key-engineer
    prompt: Your best engineer has an offer from a rival paying 20% more. Your first thought is to match it. What do you do before deciding?
    options:
      - Ask her what would make her stay, and list a few options
      - Match the offer at once, before she signs
      - Weigh matching against letting her go, on cost alone
    answer: 0
    feedback:
      - ''
      - Speed feels decisive, but money may not be why she is looking. You might pay 20% more and lose her anyway.
      - That compares two options, both about the offer. A new role, more flexibility or a promotion date are not on the list at all.
    explanation: Matching or not is a yes or a no. Asking what matters to her turns up other options, such as a new role, flexible hours or a clear path to promotion, which may cost less and work better. Compare them all, then choose.
  - kind: choice
    id: summer-project
    prompt: You must choose a summer project. Your tutor has offered one, and a friend wants you to join theirs. How do you choose?
    options:
      - Find a third option, then compare all three
      - Compare the two offers in detail, point by point
      - Take the tutor's, since it will count for more
    answer: 0
    feedback:
      - ''
      - Careful comparison is good, but only between the options on the table. The best one may be one nobody has offered yet.
      - It might count for more, but that settles it on one point before you have looked at anything else.
    explanation: Two offers make a choice look complete. A third option, such as a project you propose yourself, changes the comparison, even if you do not take it.
  - kind: choice
    id: compare
    prompt: Rxa7 grabs a pawn; Nf6+ wins the queen. What does choosing between them share with the engineer's case?
    position: 6k1/p2q4/8/8/4N3/8/8/R5K1 w - - 0 1
    alongside: A manager must decide whether to match a rival's offer to a key engineer.
    options:
      - Name several options and compare them before choosing
      - Both are about winning something from the other side
      - Both reward the first good idea, played quickly
    answer: 0
    feedback:
      - ''
      - Winning material is the surface of the board. The engineer's case is not about taking anything; what they share is how the choice is made.
      - The first idea here, Rxa7, loses the rook. Playing it quickly is the mistake both cases warn against.
    explanation: On the board you name the checks, captures and threats, then compare. At work you name more than match or let go. In both, the best move is often not the first one you see.
  - kind: plan
    id: plan
    prompt: 'Use it this week. When will you look at three?'
    situations:
      - 'a decision reaches me as a yes or a no'
      - 'I am about to take the first option that seems fine'
      - 'I choose a course, a supplier or a project'
    action: 'I will write down three options before I compare any of them'
---

Chess players call these candidate moves. Off the board, naming options before choosing becomes a habit only if you practise it there, as this week's task asks.
