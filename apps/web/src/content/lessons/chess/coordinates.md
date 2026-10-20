---
title: Name the squares
summary: Every square has a name, file letter first, then rank number. Learn them, then find squares without looking at the edges.
game: chess
stage: 0
order: 1
skills: []
steps:
  - kind: read
    id: files
    text: Files are the columns. They are lettered a to h, starting from White's left. This one is the e-file.
    position: empty
    highlight: [e1, e2, e3, e4, e5, e6, e7, e8]
  - ask: chess/coordinates/pick-e-file
  - kind: read
    id: ranks
    text: Ranks are the rows. They are numbered 1 to 8, starting from White's side. This one is the fourth rank.
    position: empty
    highlight: [a4, b4, c4, d4, e4, f4, g4, h4]
  - ask: chess/coordinates/pick-fourth-rank
  - kind: read
    id: square-names
    text: A square's name is its file, then its rank. Where the e-file crosses the fourth rank is e4.
    position: empty
    highlight: [e4]
  - ask: chess/coordinates/find-e4
  - ask: chess/coordinates/find-d5
  - ask: chess/coordinates/find-h1
  - ask: chess/coordinates/find-c6-black
---

You will read and say square names in every lesson from now on. First see how the names work, then find squares without help from the edges.
