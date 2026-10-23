<script lang="ts">
  import { tick } from 'svelte';
  import { START, legalDests, playUci } from '../lib/chess';
  import { coachNote, gentleReply } from '../lib/first-moves';
  import { markMet } from '../lib/meet';
  import Board from './Board.svelte';

  /**
   * Play your first moves: a short game as White against a gentle bot, with
   * each rule explained the moment it comes up. Twelve moves, or the end of the
   * game, and chess is met: its questions open up across the site.
   */
  const MOVES = 12;
  /** Shown when a move needs no rule of its own: what to try next. */
  const TIPS = [
    'You play White, the pieces nearest you. The aim of chess is to trap the black king. Start with a pawn, one of the small pieces in front: drag it, or tap it and then a square. Pawns move straight ahead, one square, or two on their first move. They take enemy pieces one square diagonally forward.',
    'Knights jump in an L: two squares one way, one square to the side. They are the only pieces that hop over others.',
    'Bishops slide along diagonals. Rooks slide in straight lines, up, down or sideways. The queen moves both ways. None of them can jump over other pieces.',
    'The king moves one square in any direction. Keep it safe: if it is attacked and cannot escape, the game is lost.',
    'A good start: bring out your knights and bishops before the queen, and look at what Black could take after each move.',
  ];

  let fen = $state(START);
  let played = $state(0);
  let lastMove = $state<string>();
  let note = $state(TIPS[0]!);
  let busy = $state(false);
  let done = $state(false);
  let heading = $state<HTMLElement>();

  async function finish(ending: string) {
    done = true;
    note = `${ending} You have met the game: chess questions are now open to you across the site.`;
    await markMet('chess/first-moves');
    await tick();
    heading?.focus();
  }

  function onmove(uci: string) {
    if (busy || done) return false;
    const before = fen;
    fen = playUci(before, uci);
    lastMove = uci;
    played++;
    note = coachNote(before, uci) ?? TIPS[Math.min(played, TIPS.length - 1)]!;
    const reply = gentleReply(fen, Math.random);
    if (!reply) {
      finish('The game is over.');
      return true;
    }
    busy = true;
    // A short pause, so the learner sees their move before the reply.
    setTimeout(() => {
      const prior = fen;
      fen = playUci(prior, reply);
      lastMove = reply;
      busy = false;
      const said = coachNote(prior, reply);
      if (said) note = said;
      if (!gentleReply(fen, Math.random)) finish(said ?? 'The game is over.');
      else if (played >= MOVES) finish('That was twelve moves of chess.');
    }, 500);
    return true;
  }

  function skip() {
    finish('Good: you already play.');
  }
</script>

<div class="first-moves">
  <div class="board">
    <Board {fen} {lastMove} interactive={!busy && !done && legalDests(fen).size > 0} label="Chess board: you play White" {onmove} />
  </div>
  <div class="coach">
    <p class="count label">{done ? 'Done' : `Move ${Math.min(played + 1, MOVES)} of ${MOVES}`}</p>
    <p class="note" aria-live="polite" data-testid="coach">{note}</p>
    {#if done}
      <h2 tabindex="-1" bind:this={heading}>You have met chess</h2>
      <p>Each rule has a short lesson of its own, starting with naming the squares.</p>
      <div class="actions">
        <a class="button primary" href="/chess/coordinates/">Start the chess lessons</a>
        <a class="button" href="/skills/">Back to strategy</a>
      </div>
    {:else}
      <button class="button" type="button" onclick={skip}>I already play chess</button>
    {/if}
  </div>
</div>

<style>
  .first-moves {
    display: grid;
    gap: 16px 32px;
  }
  @media (min-width: 820px) {
    .first-moves {
      grid-template-columns: minmax(0, 480px) minmax(0, 1fr);
      align-items: start;
    }
  }
  .note {
    font-size: 1.1rem;
    min-height: 6em;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  h2:focus {
    outline: none;
  }
</style>
