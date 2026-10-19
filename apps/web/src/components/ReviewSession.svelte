<script lang="ts">
  import type { GradedStep } from '@chaalwise/core/lesson';
  import { openProgress } from '@chaalwise/core/progress';
  import { onMount } from 'svelte';
  // Loaded with the page, not on demand: see LessonPage.svelte.
  import '@chaalwise/core/srs';
  import { isPracticeKind } from '../lib/practice-kinds';
  import { shuffle } from '../lib/random';
  import PracticeRound from './PracticeRound.svelte';

  interface Props {
    /** Every graded step, keyed by card id (`<lessonId>/<stepId>`). */
    steps: Record<string, GradedStep>;
  }

  let { steps }: Props = $props();
  let items = $state<{ cardId: string; step: GradedStep }[] | undefined>();
  let failed = $state(false);

  onMount(async () => {
    try {
      const progress = await openProgress();
      const due = await progress.dueCards(new Date());
      progress.close();
      // Mixed order: interleaving beats reviewing one lesson's questions in a block.
      const ids = shuffle(due.map((c) => c.id).filter((id) => id in steps));
      // A card that names a practice comes back as a fresh position of the same idea.
      const needsPractice = ids.some((id) => steps[id]!.practice);
      const { practiceStep } = needsPractice ? await import('../lib/practice') : { practiceStep: undefined };
      items = ids.map((cardId) => {
        const step = steps[cardId]!;
        const kind = step.practice;
        const fresh = kind && isPracticeKind(kind) && practiceStep ? { ...practiceStep(kind, Math.random), measures: step.measures } : step;
        return { cardId, step: fresh };
      });
    } catch (error) {
      console.error(error);
      failed = true;
    }
  });
</script>

{#if failed}
  <p>Your progress could not be read on this device.</p>
{:else if !items}
  <p>Loading your reviews…</p>
{:else if items.length === 0}
  <div class="card" data-testid="review-empty">
    <h2>Nothing to review today</h2>
    <p>Questions from finished lessons come back here on later days, just before you would forget them, often in a new position.</p>
    <a class="button primary" href="/chess/">Go to the lessons</a>
  </div>
{:else}
  <p class="label">{items.length} to review</p>
  <PracticeRound {items} source="review">
    {#snippet after()}
      <a class="button primary" href="/chess/">Back to the lessons</a>
    {/snippet}
  </PracticeRound>
{/if}
