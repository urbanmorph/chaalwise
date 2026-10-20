<script lang="ts">
  import type { GradedStep } from '@chaalwise/core/lesson';
  import { tick } from 'svelte';
  import { readDone } from '../lib/done-lessons';
  import { askable, gamesMet } from '../lib/games';
  import { mixedIds, roundItems, type RoundItem } from '../lib/round-items';
  import PracticeRound from './PracticeRound.svelte';

  /** Practice across every skill in mixed order, any time, due or not. */
  let { steps }: { steps: Record<string, GradedStep> } = $props();
  const ROUND = 8;
  let items = $state<RoundItem[]>();
  let rounds = $state(0);
  let heading = $state<HTMLElement>();

  async function practise() {
    // Meet the game first: only questions about games played on this device, and about life.
    const met = gamesMet(readDone());
    const open = Object.fromEntries(Object.entries(steps).filter(([id, step]) => askable(id, step, met)));
    items = await roundItems(mixedIds(open, ROUND, Math.random), open);
    rounds++;
    await tick();
    heading?.focus();
  }
</script>

<section class="mixed" aria-labelledby="mixed-title">
  <h2 id="mixed-title">Mixed practice</h2>
  <p>{ROUND} questions from every skill, one idea after another. Working out which idea each one needs is part of the practice.</p>
  {#if !items}
    <button class="button" type="button" onclick={practise}>Practise a mix</button>
  {:else}
    {#key rounds}
      <h3 tabindex="-1" bind:this={heading}>A mix of {items.length}</h3>
      <PracticeRound {items} source="practice">
        {#snippet after()}
          <button class="button primary" type="button" onclick={practise}>Another mix</button>
        {/snippet}
      </PracticeRound>
    {/key}
  {/if}
</section>

<style>
  .mixed {
    margin-top: 40px;
  }
  h3:focus {
    outline: none;
  }
</style>
