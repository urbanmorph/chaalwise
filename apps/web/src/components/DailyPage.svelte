<script lang="ts">
  import { onMount } from 'svelte';
  import { readDaily, today, type DailyRecord } from '../lib/streak';
  import DailyChess from './DailyChess.svelte';
  import DailyPoker from './poker/DailyPoker.svelte';

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
    <strong>{current} {current === 1 ? 'day' : 'days'}</strong> in a row{record.streak?.last === date
      ? ', today included'
      : ': solve one of today’s to keep it going'}.
    {#if record.streak && record.streak.best > current}<span class="best">Best: {record.streak.best} days.</span>{/if}
  {:else}
    Solve one of today’s puzzles to start a streak. New ones come every day.
  {/if}
</p>

<section aria-labelledby="chess-title">
  <h2 id="chess-title">Today’s chess puzzle</h2>
  <DailyChess onfinished={(r) => (record = r)} />
</section>

<section aria-labelledby="poker-title">
  <h2 id="poker-title">Today’s poker puzzle</h2>
  <p class="sub">One exercise from the <a href="/poker/drills/">poker drills</a>, worked out by the same odds the practice tables use. Practice points only.</p>
  <DailyPoker onfinished={(r) => (record = r)} />
</section>

<style>
  .streak {
    font-size: 1.05rem;
  }
  .sub {
    color: var(--ink-2);
  }
  .best {
    color: var(--ink-2);
    margin-left: 6px;
  }
  section {
    margin-top: 28px;
  }
</style>
