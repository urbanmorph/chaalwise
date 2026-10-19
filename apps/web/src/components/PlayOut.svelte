<script lang="ts">
  import type { Step } from '@chaalwise/core/lesson';
  import type { Turn } from '@chaalwise/teach/play';
  import { onDestroy, tick } from 'svelte';
  import { playUci, toFen } from '../lib/chess';
  import { playTurnInBackground } from '../lib/coach';
  import Board from './Board.svelte';

  interface Props {
    step: Extract<Step, { kind: 'play' }>;
    /** The step is finished (won, or the answer shown): the board stops taking moves. */
    finished: boolean;
    /** Called when a game ends: whether it was won, and how many moves it took. */
    onresult: (won: boolean, used: number) => void;
  }

  let { step, finished, onresult }: Props = $props();

  const REASONS: Record<NonNullable<Turn['reason']>, string> = {
    stalemate: 'Stalemate: their king had no move and was not in check, so it is a draw.',
    'piece-lost': 'Their king took your piece, and a king alone cannot mate.',
    'out-of-moves': 'Out of moves. Shrink the box with every move and bring your own king.',
  };

  const start = () => ({ fen: toFen(step.position), used: 0, lastMove: undefined as string | undefined });
  let game = $state(start());
  let busy = $state(false);
  let nudge = $state<string | undefined>();
  let result = $state<string | undefined>();
  let reply = $state('');
  let over = $state(false);
  let againButton = $state<HTMLButtonElement>();
  // A reply that arrives after the learner has moved on must not grade the next step.
  let gone = false;
  onDestroy(() => (gone = true));

  const movesLeft = $derived(step.within - game.used);

  function onmove(uci: string) {
    if (busy || over) return false;
    const before = game.fen;
    // Show the learner's move at once; the reply comes from the background worker.
    game = { ...game, fen: playUci(before, uci), lastMove: uci };
    busy = true;
    nudge = undefined;
    reply = '';
    playTurnInBackground(before, uci, movesLeft)
      .then(async (turn) => {
        if (gone || finished) return;
        game = { fen: turn.fen, used: game.used + 1, lastMove: turn.reply ?? uci };
        nudge = turn.nudge?.text;
        if (turn.reply) reply = `Their king went to ${turn.reply.slice(2, 4)}.`;
        if (turn.status === 'playing') return;
        over = true;
        result = turn.status === 'won' ? 'Checkmate!' : REASONS[turn.reason!];
        onresult(turn.status === 'won', game.used);
        await tick();
        againButton?.focus();
      })
      .catch((error) => {
        console.error(error);
        if (gone) return;
        game = { ...game, fen: before, lastMove: game.used ? game.lastMove : undefined };
        nudge = 'Something went wrong working out the reply. Try that move again.';
      })
      .finally(() => (busy = false));
    return true;
  }

  function again() {
    game = start();
    nudge = result = undefined;
    reply = '';
    over = false;
  }
</script>

<div class="play">
  <Board
    fen={game.fen}
    lastMove={game.lastMove}
    orientation={step.orientation}
    interactive={!busy && !over && !finished}
    typing={!over && !finished}
    label={over || finished ? 'Chess board' : 'Chess board: make your move'}
    {onmove}
  />
  <p class="label" aria-live="polite">
    {#if over}{result}{:else}{reply} {movesLeft} {movesLeft === 1 ? 'move' : 'moves'} left{/if}
  </p>
  {#if nudge}<p class="nudge" role="status">{nudge}</p>{/if}
  {#if over && !finished}
    <button class="button" type="button" onclick={again} bind:this={againButton}>Try again</button>
  {/if}
</div>

<style>
  .play {
    display: grid;
    gap: 10px;
    justify-items: start;
  }
  .label {
    margin: 0;
  }
  .nudge {
    margin: 0;
    padding: 10px 14px;
    border-left: 3px solid var(--accent);
    background: var(--tint);
    border-radius: 0 var(--radius) var(--radius) 0;
    max-width: 480px;
  }
</style>
