---
title: Find what everything depends on
summary: Find the one part that holds everything else up. Strike it if it is theirs; back it up if it is yours.
game: strategy
stage: 4
order: 1
skills: [calculate]
after: chess/pin
steps:
  - kind: read
    id: on-the-board
    text: On the chessboard, Black's bishop on d4 is guarded only by the knight on c6. That knight is pinned. White's bishop on b5 attacks it, and if it moved, Black's king behind it would be in check, which the rules do not allow. The whole defence rests on one piece, and that piece cannot move. So White's rook takes the bishop (Rxd4), and the knight cannot take back.
    position: 4k3/pp3ppp/2n5/1B6/3b4/8/PP3PPP/3R2K1 w - - 0 1
    highlight: [c6, d4]
    arrows: [d1d4, c6d4, b5e8]
  - ask: chess/find-what-everything-depends-on/remove-the-guard
  - kind: read
    id: off-the-board
    text: Off the board, plans, teams and deals often rest on one part, such as a single supplier, the one person who knows the system, or one assumption. Find it before you act. If it is theirs, that is where to press. If it is yours, back it up before someone else finds it.
  - ask: life/find-what-everything-depends-on/one-mill
  - ask: life/find-what-everything-depends-on/group-report
  - ask: chess/find-what-everything-depends-on/compare
  - kind: plan
    id: plan
    prompt: 'Use it this week. When will you look for what everything depends on?'
    situations:
      - 'I plan a project with several parts'
      - 'I get ready for an exam, a trip or an event'
      - "I size up a rival's plan or offer"
    action: 'I will name the one thing it all rests on, and back it up or plan around it'
---

Pins and guards teach you to see what holds a position together. Off the board, looking for it becomes a habit only if you practise it there too, as this week's task asks.
