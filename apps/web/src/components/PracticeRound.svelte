<script lang="ts">
  import type { Outcome } from '@chaalwise/core/player';
  import { count } from '../lib/count';
  import { isNewerVersionOpen, openProgress } from '@chaalwise/core/progress';
  import type { Snippet } from 'svelte';
  import { guessChance, logAttempt } from '../lib/attempts';
  import type { RoundItem } from '../lib/round-items';
  import Round from './Round.svelte';
  import SaveStatus, { type SaveState } from './SaveStatus.svelte';
  import { summarise } from './outcomes';

  /**
   * A round of review or practice: each item is a question and the review card
   * it counts towards. Each grade is saved as it is given, so leaving halfway
   * keeps what was done.
   */
  interface Props {
    items: RoundItem[];
    /** Where the answers come from, for the skill profile. */
    source: 'review' | 'practice';
    after: Snippet;
  }

  let { items, source, after }: Props = $props();

  // Step ids must be unique within a round; the card id is kept alongside.
  const round = $derived({ steps: items.map((item, i) => ({ ...item.step, id: `item-${i}` })) });
  const itemFor = (stepId: string) => items[Number(stepId.slice(5))]!;

  let saved = $state<SaveState>('saving');
  let unsaved: [string, Outcome][] = [];
  let saving = Promise.resolve();

  async function save(grades: [string, Outcome][]) {
    const progress = await openProgress();
    try {
      // Review reschedules each card; practice only adds new ones and reschedules those due.
      const record = source === 'review' ? progress.recordReview : progress.recordPractice;
      for (const [stepId, outcome] of grades) await record(itemFor(stepId).cardId, outcome, new Date());
    } finally {
      progress.close();
    }
  }

  function onstep(stepId: string, outcome: Outcome, confidence?: number) {
    const { cardId, step } = itemFor(stepId);
    logAttempt(step.measures, outcome, source, { item: cardId, chance: guessChance(step), confidence });
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
      count(`round:${source}`);
      saved = 'saved';
    } catch (error) {
      console.error(error);
      saved = isNewerVersionOpen(error) ? 'newer' : 'failed';
    }
  }
</script>

<Round steps={round.steps} contexts={items.map((item) => item.context)} {onfinish} {onstep}>
  {#snippet summary(outcomes)}
    <div class="card" data-testid="round-done">
      <h2>Round done</h2>
      <p>{summarise(outcomes)}. The ones you missed come back sooner.</p>
      <SaveStatus status={saved} saved="Saved on this device." onretry={onfinish} />
      {@render after()}
    </div>
  {/snippet}
</Round>
