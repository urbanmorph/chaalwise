<script lang="ts">
  import type { GradedStep } from '@chaalwise/core/lesson';
  import type { Outcome } from '@chaalwise/core/player';
  import { isNewerVersionOpen, openProgress } from '@chaalwise/core/progress';
  import type { Snippet } from 'svelte';
  import LessonPlayer from './LessonPlayer.svelte';
  import SaveStatus, { type SaveState } from './SaveStatus.svelte';
  import { summarise } from './outcomes';

  /**
   * A round of review or practice: each item is a question and the review card
   * it counts towards. Each grade is saved as it is given, so leaving halfway
   * keeps what was done.
   */
  interface Props {
    items: { cardId: string; step: GradedStep }[];
    after: Snippet;
  }

  let { items, after }: Props = $props();

  // Step ids must be unique within a round; the card id is kept alongside.
  const round = $derived({ steps: items.map((item, i) => ({ ...item.step, id: `item-${i}` })) });
  const cardFor = (stepId: string) => items[Number(stepId.slice(5))]!.cardId;

  let saved = $state<SaveState>('saving');
  let unsaved: [string, Outcome][] = [];
  let saving = Promise.resolve();

  async function save(grades: [string, Outcome][]) {
    const progress = await openProgress();
    try {
      for (const [stepId, outcome] of grades) await progress.recordReview(cardFor(stepId), outcome, new Date());
    } finally {
      progress.close();
    }
  }

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
      saved = isNewerVersionOpen(error) ? 'newer' : 'failed';
    }
  }
</script>

<LessonPlayer lesson={round} {onfinish} {onstep}>
  {#snippet finished(outcomes)}
    <div class="card" data-testid="round-done">
      <h2>Round done</h2>
      <p>{summarise(outcomes)}. The ones you missed come back sooner.</p>
      <SaveStatus status={saved} saved="Saved on this device." onretry={onfinish} />
      {@render after()}
    </div>
  {/snippet}
</LessonPlayer>
