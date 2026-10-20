<script lang="ts">
  import type { GradedStep } from '@chaalwise/core/lesson';
  import { openProgress } from '@chaalwise/core/progress';
  import { onMount } from 'svelte';
  // Loaded with the page, not on demand: see LessonPage.svelte.
  import '@chaalwise/core/srs';
  import { PROFILE_SKILLS, trackOf } from '../lib/profile-skills';
  import { shuffle } from '../lib/random';
  import { roundItems, type RoundItem } from '../lib/round-items';
  import PracticeRound from './PracticeRound.svelte';

  interface Props {
    /** Every graded step, keyed by card id (`<lessonId>/<stepId>`). */
    steps: Record<string, GradedStep>;
  }

  let { steps }: Props = $props();
  let items = $state<RoundItem[] | undefined>();
  /** A review of one strategy track's questions, from the track's course page (`?track=`). */
  let track = $state<string | null>(null);
  const trackName = $derived(PROFILE_SKILLS.find((s) => s.id === track)?.name);
  let failed = $state(false);

  onMount(async () => {
    track = new URLSearchParams(location.search).get('track');
    try {
      const progress = await openProgress();
      const due = await progress.dueCards(new Date());
      progress.close();
      // Mixed order: interleaving beats reviewing one lesson's questions in a block.
      const ids = shuffle(due.map((c) => c.id).filter((id) => id in steps && (!track || trackOf(steps[id]!.measures) === track)));
      items = await roundItems(ids, steps);
    } catch (error) {
      console.error(error);
      failed = true;
    }
  });
</script>

{#if trackName}
  <p class="only">Only {trackName} questions. <a href="/review/">Review everything</a></p>
{/if}

{#if failed}
  <p>Your progress could not be read on this device.</p>
{:else if !items}
  <p>Loading your reviews…</p>
{:else if items.length === 0}
  <div class="card" data-testid="review-empty">
    <h2>Nothing to review today</h2>
    <p>Questions from finished lessons come back here on later days, just before you would forget them, chess ideas often in a new position.</p>
    <a class="button primary" href="/skills/">Go to the lessons</a>
  </div>
{:else}
  <p class="label">{items.length} to review</p>
  <PracticeRound {items} source="review">
    {#snippet after()}
      <a class="button primary" href="/skills/">Back to the lessons</a>
    {/snippet}
  </PracticeRound>
{/if}
