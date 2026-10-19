---
title: Name the squares
summary: Every square has a name, file letter first, then rank number. Learn them, then find squares without looking at the edges.
game: chess
stage: 0
order: 1
skills: []
measures: board
steps:
  - kind: read
    id: files
    text: Files are the columns. They are lettered a to h, starting from White's left. This one is the e-file.
    position: empty
    highlight: [e1, e2, e3, e4, e5, e6, e7, e8]
  - kind: square
    id: pick-e-file
    prompt: Click any square on the e-file.
    position: empty
    coordinates: true
    answers: [e1, e2, e3, e4, e5, e6, e7, e8]
    hint: Find the letter e along the bottom edge, then go straight up from it.
    explanation: Every square in that column has e in its name, from e1 at the bottom to e8 at the top.
  - kind: read
    id: ranks
    text: Ranks are the rows. They are numbered 1 to 8, starting from White's side. This one is the fourth rank.
    position: empty
    highlight: [a4, b4, c4, d4, e4, f4, g4, h4]
  - kind: square
    id: pick-fourth-rank
    prompt: Click any square on the fourth rank.
    position: empty
    coordinates: true
    answers: [a4, b4, c4, d4, e4, f4, g4, h4]
    hint: Find the number 4 along the left edge, then go straight across from it.
    explanation: Every square in that row has 4 in its name, from a4 on the left to h4 on the right.
  - kind: read
    id: square-names
    text: A square's name is its file, then its rank. Where the e-file crosses the fourth rank is e4.
    position: empty
    highlight: [e4]
  - kind: square
    id: find-e4
    practice: find-square
    prompt: Now without the letters and numbers. Find e4.
    answers: [e4]
    hint: The e-file is the fifth from the left. Count four rows up from your side.
    explanation: e4 is in the centre, on the king's file. It is where the most common first move goes.
  - kind: square
    id: find-d5
    practice: find-square
    prompt: Find d5.
    answers: [d5]
    hint: d is next to e, towards the a-file. Rank 5 is just over halfway up.
    explanation: d5 is one of the four centre squares, with d4, e4 and e5.
  - kind: square
    id: find-h1
    practice: find-square
    prompt: Find h1.
    answers: [h1]
    hint: The last file, on your own back rank.
    explanation: h1 is the corner square on your right when you sit behind the white pieces. The next lesson shows why that corner matters.
  - kind: square
    id: find-c6-black
    practice: find-square-black
    prompt: Now you are Black, looking from the other side. Find c6.
    orientation: black
    answers: [c6]
    hint: From Black's side the a-file is on your right, and rank 8 is nearest to you.
    explanation: From Black's side everything is turned round. c6 is three files from your right and three ranks up from your side.
---

You will read and say square names in every lesson from now on. First see how the names work, then find squares without help from the edges.
