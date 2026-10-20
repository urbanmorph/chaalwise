---
title: How moves are written
summary: Read and write chess moves, so you can follow any book, video or game record.
game: chess
stage: 0
order: 12
skills: []
steps:
  - kind: read
    id: piece-letters
    text: 'Each move is written as a piece letter and the square it goes to. K is the king, Q the queen, R a rook, B a bishop and N a knight, since K is already the king. Pawns have no letter. So Nf3 means a knight goes to f3, and e4 means a pawn goes to e4.'
    position: start
  - ask: chess/notation/play-nf3
  - kind: read
    id: symbols
    text: "A few signs add the rest. x means a capture, as in Nxe5. + means check and # means checkmate. O-O is castling on the king's side and O-O-O on the queen's side. =Q means a pawn becomes a queen, as in e8=Q. A pawn that captures is named by the file it leaves, so exd5 is the e-pawn taking on d5. Moves come in numbered pairs, White's then Black's, and a Black move on its own gets three dots in front, as in ...e5."
  - ask: chess/notation/knight-takes
  - ask: chess/notation/play-exd5
  - ask: chess/notation/write-promotion
  - ask: chess/notation/read-mate
---

Books, videos and online game records all write moves the same short way. A few letters and signs are all you need to read them.
