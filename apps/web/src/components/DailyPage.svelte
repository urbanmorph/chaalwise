<script lang="ts">
  import { onMount } from 'svelte';
  import { readDaily, today, type DailyRecord } from '../lib/daily';
  import DailyChess from './DailyChess.svelte';

  /** Today's puzzles, and the streak of days with one finished, kept on this device. */
  let record = $state<DailyRecord>({ done: {} });
  onMount(() => (record = readDaily()));

  const date = today();
  // A streak is current if its last day was today or yesterday; older, it has lapsed.
  const current = $derived.by(() => {
    const s = record.streak;
    if (!s) return 0;
    const gap = Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${s.last}T00:00:00Z`)) / 86_400_000);
    return gap <= 1 ? s.streak : 0;
  });
</script>

<p class="streak" data-testid="daily-streak">
  {#if current}
    <strong>{current} {current === 1 ? 'day' : 'days'}</strong> in a row{record.done.chess?.date === date
      ? ', today included'
      : ': solve today’s to keep it going'}.
    {#if record.streak && record.streak.best > current}<span class="best">Best: {record.streak.best} days.</span>{/if}
  {:else}
    Solve today’s puzzle to start a streak. A new one comes every day.
  {/if}
</p>

<section aria-labelledby="chess-title">
  <h2 id="chess-title">Today’s chess puzzle</h2>
  <DailyChess onfinished={(r) => (record = r)} />
</section>

<style>
  .streak {
    font-size: 1.05rem;
  }
  .best {
    color: var(--ink-2);
    margin-left: 6px;
  }
  section {
    margin-top: 28px;
  }
</style>
