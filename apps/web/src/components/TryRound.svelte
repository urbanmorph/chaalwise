<script lang="ts">
  import type { GradedStep } from '@chaalwise/core/lesson';
  import type { Outcome } from '@chaalwise/core/player';
  import { openProgress } from '@chaalwise/core/progress';
  import { guessChance, logAttempt } from '../lib/attempts';
  import Round from './Round.svelte';
  import { summarise } from './outcomes';

  /**
   * A reference entry's questions, tried on the page. Each answer counts towards
   * the question's skill, and the question joins the review.
   */
  let { steps }: { steps: GradedStep[] } = $props();

  function logStep(cardId: string, outcome: Outcome, confidence?: number) {
    // Questions come from the corpus: a step's id is its review card.
    const step = steps.find((s) => s.id === cardId)!;
    logAttempt(step.measures, outcome, 'practice', { item: cardId, chance: guessChance(step), confidence });
    // Trying it once is not the last time: it comes back in review.
    openProgress()
      .then(async (progress) => {
        await progress.recordPractice(cardId, outcome, new Date());
        progress.close();
      })
      .catch(console.error);
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
