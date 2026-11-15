<script lang="ts">
  import { calibration } from '@chaalwise/core/calibration';
  import { score, verdict } from '@chaalwise/core/calibration-score';
  import type { Attempt } from '@chaalwise/core/profile';
  import { advice, scoreLine } from '../lib/calibration';
  import type { RoundItem } from '../lib/round-items';
  import CalibrationChart from './CalibrationChart.svelte';
  import PracticeRound from './PracticeRound.svelte';

  /**
   * A calibration round: questions mixed from chess, poker, the labs and life,
   * each with "how sure are you?" first, then the round's score and chart. The
   * answers feed review and the progress page like any practice.
   */
  let { items, again }: { items: RoundItem[]; again: () => void } = $props();
  const answers: Attempt[] = $state([]);
  const result = $derived(score(answers));
</script>

<PracticeRound {items} source="practice" requireConfidence onanswer={(outcome, confidence) => answers.push({ skill: '', outcome, at: new Date(), confidence })}>
  {#snippet after()}
    <div class="score" data-testid="calibration-score">
      {#if result}
        <p><strong>{scoreLine(result)}</strong></p>
        <p>The score is how close your sureness was to what happened: 0 is perfect, lower is better, and always saying 50% scores 0.25.</p>
        <p>{advice(verdict(result), 'in this round')}</p>
      {/if}
      <CalibrationChart rows={calibration(answers)} />
      <p class="note">Your progress page shows a score for each setting once it has 10 answers: chess, poker, the labs and life.</p>
    </div>
    <button class="button primary" type="button" onclick={again}>Another calibration round</button>
  {/snippet}
</PracticeRound>

<style>
  .score {
    margin: 12px 0 16px;
  }
  .note {
    color: var(--ink-2);
    margin-top: 12px;
  }
</style>
