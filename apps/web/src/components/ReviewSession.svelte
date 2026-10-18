<script lang="ts">
  import type { GradedStep } from '@chaalwise/core/lesson';
  import type { Outcome } from '@chaalwise/core/player';
  import { openProgress } from '@chaalwise/core/progress';
  // Loaded with the page, not on demand: see LessonPage.svelte.
  import '@chaalwise/core/srs';
  import { onMount } from 'svelte';
  import LessonPlayer from './LessonPlayer.svelte';
  import SaveStatus from './SaveStatus.svelte';
  import { summarise } from './outcomes';

  interface Props {
    /** Every graded step, keyed by card id (`<lessonId>/<stepId>`). */
    steps: Record<string, GradedStep>;
  }

  let { steps }: Props = $props();
  /** The session's steps, and the card each one reviews (step ids are unique per session). */
  let session = $state<{ steps: GradedStep[]; cardFor: Record<string, string> } | undefined>();
  let failed = $state(false);
  let saved = $state<'saving' | 'saved' | 'failed'>('saving');

  /** Mixed order: interleaving beats reviewing one lesson's questions in a block. */
  const shuffle = <T,>(items: T[]) => {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j]!, items[i]!];
    }
    return items;
  };

  onMount(async () => {
    try {
      const progress = await openProgress();
      const due = await progress.dueCards(new Date());
      progress.close();
      const ids = shuffle(due.map((c) => c.id).filter((id) => id in steps));
      session = {
        steps: ids.map((id, i) => ({ ...steps[id]!, id: `card-${i}` })),
        cardFor: Object.fromEntries(ids.map((id, i) => [`card-${i}`, id])),
      };
    } catch (error) {
      console.error(error);
      failed = true;
    }
  });

  /** Grades not yet saved, and the saves in flight, in order. */
  let unsaved: [string, Outcome][] = [];
  let saving = Promise.resolve();

  async function save(grades: [string, Outcome][]) {
    const progress = await openProgress();
    try {
      for (const [stepId, outcome] of grades) {
        await progress.recordReview(session!.cardFor[stepId]!, outcome, new Date());
      }
    } finally {
      progress.close();
    }
  }

  // Each grade is saved as it is given, so leaving halfway keeps what was done.
  function onstep(stepId: string, outcome: Outcome) {
    saving = saving.then(() =>
      save([[stepId, outcome]]).catch((error) => {
        console.error(error);
        unsaved.push([stepId, outcome]);
      }),
    );
  }

  async function onfinish() {
    saved = 'saving';
    await saving;
    try {
      await save(unsaved);
      unsaved = [];
      saved = 'saved';
    } catch (error) {
      console.error(error);
      saved = 'failed';
    }
  }
</script>

{#if failed}
  <p>Your progress could not be read on this device.</p>
{:else if !session}
  <p>Loading your reviews…</p>
{:else if session.steps.length === 0}
  <div class="card" data-testid="review-empty">
    <h2>Nothing to review today</h2>
    <p>
      Questions from finished lessons come back here on later days, just before you would forget
      them.
    </p>
    <a class="button primary" href="/chess/">Go to the lessons</a>
  </div>
{:else}
  <p class="label">{session.steps.length} to review</p>
  <LessonPlayer lesson={session} {onfinish} {onstep}>
    {#snippet finished(outcomes)}
      <div class="card">
        <h2>Review done</h2>
        <p>{summarise(outcomes)}. The ones you missed come back sooner.</p>
        <SaveStatus status={saved} saved="Saved on this device." onretry={onfinish} />
        <a class="button primary" href="/chess/">Back to the lessons</a>
      </div>
    {/snippet}
  </LessonPlayer>
{/if}
