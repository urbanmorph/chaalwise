<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { logAttempt } from '../lib/attempts';
  import { count } from '../lib/count';
  import { dailyChess } from '../lib/daily';
  import { finishDaily, readDaily, today, type DailyRecord } from '../lib/streak';
  import { begin, move, puzzlesFor, type PuzzleState } from '../lib/puzzles';
  import Board from './Board.svelte';

  /**
   * Today's chess puzzle: one from the Lichess puzzle database shipped with the site,
   * the same for everyone today. Finishing it keeps the daily streak going.
   */
  let { onfinished }: { onfinished?: (record: DailyRecord) => void } = $props();

  const date = today();
  const { theme, band, index } = dailyChess(date);
  let current = $state.raw<PuzzleState>();
  let missed = $state(false);
  let solved = $state(false);
  let doneBefore = $state(false);
  let status = $state<HTMLElement>();

  onMount(async () => {
    doneBefore = readDaily().done.chess?.date === date;
    const puzzles = await puzzlesFor(theme.id, band);
    current = begin(puzzles[index % puzzles.length]!);
  });

  async function finish(right: boolean) {
    solved = true;
    if (!doneBefore) {
      logAttempt(theme.skill, right ? 'first-try' : 'missed', 'drill', { item: current!.puzzle.id });
      count('drill:daily-chess');
      onfinished?.(finishDaily('chess', date, right));
      doneBefore = true;
    }
    await tick();
    status?.focus();
  }

  function onmove(uci: string): boolean {
    if (!current || solved) return false;
    const { result, state: after } = move(current, uci);
    if (result === 'wrong') {
      missed = true;
      return false;
    }
    current = after;
    if (result === 'solved') finish(!missed);
    return true;
  }

  function showAnswer() {
    if (!current) return;
    let s = current;
    while (s.next < s.puzzle.moves.length) s = move(s, s.puzzle.moves[s.next]!).state;
    current = s;
    missed = true;
    finish(false);
  }
</script>

<div class="daily">
  {#if current}
    <div class="board-col">
      <Board
        fen={current.fen}
        orientation={current.side}
        lastMove={current.lastMove}
        interactive={!solved}
        {onmove}
        label="Chess board: today's puzzle, find the best move"
      />
    </div>
    <div class="side">
      <p class="label">{band.name} · {current.side === 'white' ? 'White' : 'Black'} to play</p>
      <h3>{theme.title}: find the best move.</h3>
      <div aria-live="polite">
        {#if solved}
          <p class="feedback" class:pass={!missed} class:warn={missed} tabindex="-1" bind:this={status}>
            {missed ? 'The answer is played on the board. Look for this idea next time.' : 'Solved!'}
          </p>
        {:else if missed}
          <p class="feedback warn">Not that one. Try again, or show the answer.</p>
        {/if}
      </div>
      {#if !solved}
        <button class="button" type="button" onclick={showAnswer}>Show the answer</button>
      {:else}
        <p><a href={`/chess/puzzles/?theme=${theme.id}`}>Ten more {theme.title.toLowerCase()} puzzles</a></p>
      {/if}
      <p class="credit">Puzzle {current.puzzle.id} from the Lichess puzzle database, rated {current.puzzle.rating}.</p>
    </div>
  {:else}
    <p class="label">Loading today's puzzle…</p>
  {/if}
</div>

<style>
  .daily {
    display: grid;
    gap: 20px 32px;
  }
  /* On a phone the task comes before the board. */
  @media (max-width: 799px) {
    .side {
      order: -1;
    }
  }
  @media (min-width: 800px) {
    .daily {
      grid-template-columns: minmax(0, 420px) 1fr;
      align-items: start;
    }
  }
  .credit {
    margin-top: 16px;
    color: var(--ink-2);
    font-size: 0.85rem;
  }
  .feedback.pass {
    color: var(--pass);
  }
  .feedback.warn {
    color: var(--warn);
  }
  .feedback:focus {
    outline: none;
  }
</style>
