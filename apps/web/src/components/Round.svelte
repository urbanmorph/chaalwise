<script lang="ts">
  import type { GradedStep } from '@chaalwise/core/lesson';
  import type { Outcome } from '@chaalwise/core/player';
  import type { Snippet } from 'svelte';
  import LessonPlayer from './LessonPlayer.svelte';

  /**
   * A round of questions that ends on a right answer: once it is graded, the
   * ones missed can be gone over again at once, in a fresh order and not
   * graded twice (successive relearning: recall each one correctly once per sitting).
   */
  interface Props {
    steps: GradedStep[];
    onstep: (stepId: string, outcome: Outcome) => void;
    onfinish: (outcomes: Record<string, Outcome>) => void;
    /** The end-of-round card. */
    summary: Snippet<[Record<string, Outcome>]>;
  }

  let { steps, onstep, onfinish, summary }: Props = $props();
  let graded = $state<Record<string, Outcome>>();
  let again = $state<GradedStep[]>();
  const missed = $derived(graded ? steps.filter((s) => graded![s.id] === 'missed') : []);

  function finish(outcomes: Record<string, Outcome>) {
    graded = outcomes;
    onfinish(outcomes);
  }
</script>

{#if again}
  <LessonPlayer lesson={{ steps: again }} onfinish={() => {}}>
    {#snippet finished()}
      {@render summary(graded!)}
    {/snippet}
  </LessonPlayer>
{:else}
  <LessonPlayer lesson={{ steps }} onfinish={finish} {onstep}>
    {#snippet finished(outcomes)}
      {@render summary(outcomes)}
      {#if missed.length}
        <button class="button primary again" type="button" onclick={() => (again = missed)}>
          Go over the {missed.length === 1 ? 'one' : missed.length} you missed
        </button>
      {/if}
    {/snippet}
  </LessonPlayer>
{/if}

<style>
  .again {
    margin-top: 12px;
  }
</style>
