<script lang="ts">
  import type { GradedStep } from '@chaalwise/core/lesson';
  import { onMount, tick } from 'svelte';
  import { readDone } from '../lib/done-lessons';
  import type { FitsBank } from '../lib/fits';
  import { askable, gamesMet } from '../lib/games';
  import { mixedIds, roundItems, type RoundItem } from '../lib/round-items';
  import PracticeRound from './PracticeRound.svelte';

  /** Practice across every skill in mixed order, any time, due or not; and "Which idea fits?" rounds once three strategy lessons are done. */
  let { steps, fits }: { steps: Record<string, GradedStep>; fits: FitsBank } = $props();
  const ROUND = 8;
  let items = $state<RoundItem[]>();
  /** Which round is showing. */
  let kind = $state<'mix' | 'fits'>('mix');
  let rounds = $state(0);
  let heading = $state<HTMLElement>();
  /** Loaded once the page runs, as are the lessons finished on this device, which are not known while it is built. */
  let lib = $state<typeof import('../lib/fits')>();
  const canFit = $derived(!!lib?.fitsOpen(fits, readDone()));
  onMount(() => import('../lib/fits').then((m) => (lib = m)).catch(console.error));

  async function practise(next: 'mix' | 'fits') {
    const { withFits, fitsIds, FITS_ROUND } = lib ?? (await import('../lib/fits'));
    const done = readDone();
    // Meet the game first: only questions about games played on this device, and about life.
    const met = gamesMet(done);
    const open = withFits(Object.fromEntries(Object.entries(steps).filter(([id, step]) => askable(id, step, met))), fits, done, Math.random);
    const ids = next === 'fits' ? fitsIds(fits, done, FITS_ROUND, Math.random) : mixedIds(open, ROUND, Math.random);
    items = await roundItems(ids, open);
    kind = next;
    rounds++;
    await tick();
    heading?.focus();
  }
</script>

<section class="mixed" aria-labelledby="mixed-title">
  <h2 id="mixed-title">Mixed practice</h2>
  <p>
    {ROUND} questions mixed from all the skills, any time, whether due for review or not. Part of the practice is working out which idea each question needs.
  </p>
  <div class="actions">
    <button class="button" type="button" onclick={() => practise('mix')}>Practise a mix</button>
    {#if canFit}
      <button class="button" type="button" onclick={() => practise('fits')}>Which idea fits?</button>
    {/if}
  </div>
  {#if lib}
    <p class="note" data-testid="fits-note">
      {#if canFit}
        Which idea fits? {lib.FITS_ROUND} situations from work, study and everyday life. For each, pick the idea from your lessons that it calls for.
      {:else}
        After {lib.FITS_FROM} strategy lessons: "Which idea fits?", situations where you pick the idea that applies.
      {/if}
    </p>
  {/if}
  {#if items}
    {#key rounds}
      <h3 tabindex="-1" bind:this={heading}>{kind === 'fits' ? `Which idea fits? ${items.length} situations` : `A mix of ${items.length}`}</h3>
      <PracticeRound {items} source="practice">
        {#snippet after()}
          <button class="button primary" type="button" onclick={() => practise(kind)}>{kind === 'fits' ? 'More situations' : 'Another mix'}</button>
        {/snippet}
      </PracticeRound>
    {/key}
  {/if}
</section>

<style>
  .mixed {
    margin-top: 40px;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .note {
    color: var(--ink-2);
  }
  h3:focus {
    outline: none;
  }
</style>
