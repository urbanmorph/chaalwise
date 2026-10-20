<script lang="ts">
  import type { GradedStep } from '@chaalwise/core/lesson';
  import type { Outcome } from '@chaalwise/core/player';
  import { guessChance, logAttempt } from '../lib/attempts';
  import Round from './Round.svelte';
  import { summarise } from './outcomes';

  /**
   * A reference entry's questions, tried on the page. Answers count towards the
   * skill the idea trains, but make no review cards: the courses and lessons do that.
   */
  interface Props {
    /** The entry, such as `strategy/weakest-link`. */
    entry: string;
    steps: GradedStep[];
    measures: string | undefined;
  }

  let { entry, steps, measures }: Props = $props();

  function logStep(stepId: string, outcome: Outcome) {
    const step = steps.find((s) => s.id === stepId)!;
    logAttempt(measures, outcome, 'practice', { item: `reference/${entry}/${stepId}`, chance: guessChance(step) });
  }
  let rounds = $state(0);
</script>

{#key rounds}
  <Round {steps} onfinish={() => {}} onstep={logStep}>
    {#snippet summary(outcomes)}
      <div class="card" data-testid="try-done">
        <p>{summarise(outcomes)}.</p>
        <button class="button" type="button" onclick={() => rounds++}>Try again</button>
      </div>
    {/snippet}
  </Round>
{/key}
