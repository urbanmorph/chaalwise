<script lang="ts">
  import type { GradedStep } from '@chaalwise/core/lesson';
  import { openProgress } from '@chaalwise/core/progress';
  import { onMount } from 'svelte';
  // Loaded with the page, not on demand: see LessonPage.svelte.
  import '@chaalwise/core/srs';
  import { readDone } from '../lib/done-lessons';
  import type { FitsBank } from '../lib/fits';
  import { PROFILE_SKILLS, trackOf } from '../lib/profile-skills';
  import { shuffle } from '../lib/random';
  import { roundItems, type RoundItem } from '../lib/round-items';
  import type { LaterCaseData } from '../lib/later-cases';
  import PracticeRound from './PracticeRound.svelte';

  interface Props {
    /** Every graded step, keyed by card id (`<lessonId>/<stepId>`). */
    steps: Record<string, GradedStep>;
    /** "Which idea fits?" situations: once practised, they come back for review like any question. */
    fits: FitsBank;
    /** The cases a week later, one offered below the review when its time comes. */
    cases: LaterCaseData[];
  }

  let { steps, fits, cases }: Props = $props();
  let items = $state<RoundItem[] | undefined>();
  /** A review of one strategy track's questions, from the track's course page (`?track=`). */
  let track = $state<string | null>(null);
  const trackName = $derived(PROFILE_SKILLS.find((s) => s.id === track)?.name);
  let failed = $state(false);
  // The case a week later loads after the review, as most visits have none to offer.
  let LaterCase = $state<typeof import('./LaterCase.svelte').default>();

  onMount(async () => {
    import('./LaterCase.svelte').then((m) => (LaterCase = m.default)).catch(console.error);
    track = new URLSearchParams(location.search).get('track');
    try {
      const progress = await openProgress();
      const due = await progress.dueCards(new Date());
      progress.close();
      // A situation's options are the ideas finished on this device, so it is built here, loaded only when one is due.
      const all = due.some((c) => c.id.startsWith('fits/')) ? (await import('../lib/fits')).withFits(steps, fits, readDone(), Math.random) : steps;
      // Mixed order: interleaving beats reviewing one lesson's questions in a block.
      const ids = shuffle(due.map((c) => c.id).filter((id) => id in all && (!track || trackOf(all[id]!.measures) === track)));
      items = await roundItems(ids, all);
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
    <p>Each lesson you finish adds its questions here, on later days. Chess questions often come back in a new position.</p>
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

<!-- Part of this island, not one of its own: it plays in the same player as the review, so the pages share their code. -->
{#if LaterCase}<LaterCase {cases} />{/if}
