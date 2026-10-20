<script lang="ts">
  import type { GradedStep } from '@chaalwise/core/lesson';
  import { logAttempt } from '../lib/attempts';
  import LessonPlayer from './LessonPlayer.svelte';
  import { summarise } from './outcomes';

  /**
   * A reference entry's questions, tried on the page. Answers count towards the
   * skill the idea trains, but make no review cards: the courses and lessons do that.
   */
  interface Props {
    steps: GradedStep[];
    measures: string | undefined;
  }

  let { steps, measures }: Props = $props();
  let rounds = $state(0);
</script>

{#key rounds}
  <LessonPlayer lesson={{ steps }} onfinish={() => {}} onstep={(_, outcome) => logAttempt(measures, outcome, 'practice')}>
    {#snippet finished(outcomes)}
      <div class="card" data-testid="try-done">
        <p>{summarise(outcomes)}.</p>
        <button class="button" type="button" onclick={() => rounds++}>Try again</button>
      </div>
    {/snippet}
  </LessonPlayer>
{/key}
