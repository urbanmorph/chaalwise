<script lang="ts">
  /** A drill's best and latest scores on this device, and whether it was done today. */
  let { record }: { record: { best: number; last: number; lastAt: Date } | undefined } = $props();
  const today = $derived(record ? record.lastAt.toDateString() === new Date().toDateString() : false);
</script>

<p class="label score">
  {#if record}
    Best {record.best} · last {record.last}{#if today}<span class="done">&nbsp;· done today</span>{/if}
  {:else}
    Not tried yet
  {/if}
</p>

<style>
  .score {
    margin: 0;
  }
  .done {
    color: var(--pass);
  }
</style>
