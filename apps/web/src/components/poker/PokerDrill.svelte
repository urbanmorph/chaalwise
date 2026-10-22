<script lang="ts">
  import { openProgress, type DrillRecord } from '@chaalwise/core/progress';
  import { onMount, tick } from 'svelte';
  import { logAttempt } from '../../lib/attempts';
  import { count } from '../../lib/count';
  import { pokerItem, ROUND, type PokerDrillKind, type PokerItem } from '../../lib/poker/drills';
  import { DRILL_SKILL } from '../../lib/profile-skills';
  import DrillScore from '../DrillScore.svelte';
  import PokerQuestion from './PokerQuestion.svelte';

  /** A round of ten poker exercises of one kind, dealt and checked by the engine. */
  let { kind }: { kind: PokerDrillKind } = $props();

  const drillId = $derived(`poker-${kind}`);

  let item = $state<PokerItem>();
  let index = $state(0);
  let score = $state(0);
  let playing = $state(false);
  let finished = $state(false);
  let given = $state<number>();
  let record = $state<Omit<DrillRecord, 'drillId'>>();
  let nextButton = $state<HTMLButtonElement>();
  let resultText = $state<HTMLElement>();

  onMount(async () => {
    const progress = await openProgress();
    record = (await progress.drills())[drillId];
    progress.close();
  });

  /** Deal the next exercise, after the page has had a moment to show the last answer gone (equity takes a moment to work out). */
  async function deal() {
    given = undefined;
    item = undefined;
    await new Promise((resolve) => setTimeout(resolve));
    item = pokerItem(kind);
  }

  function start() {
    index = score = 0;
    playing = true;
    finished = false;
    deal();
  }

  async function answer(value: number) {
    if (!item || given !== undefined) return;
    given = value;
    if (value === item.answer) score++;
    const guess = item.options ? { chance: 1 / item.options.length } : {};
    logAttempt(DRILL_SKILL[drillId], value === item.answer ? 'first-try' : 'missed', 'drill', guess);
    await tick();
    nextButton?.focus();
  }

  async function next() {
    index++;
    if (index < ROUND) return deal();
    playing = false;
    finished = true;
    item = undefined;
    // Finish removed the focused button: move focus to the result.
    await tick();
    resultText?.focus();
    const progress = await openProgress();
    await progress.recordDrill(drillId, score, new Date());
    count(`drill:${drillId}`);
    record = (await progress.drills())[drillId];
    progress.close();
  }
</script>

{#if playing}
  <PokerQuestion {item} {given} onanswer={answer} label={`${index + 1} of ${ROUND} · ${score} right`}>
    {#snippet after()}
      <button class="button primary" onclick={next} bind:this={nextButton}>{index + 1 === ROUND ? 'Finish' : 'Next'}</button>
    {/snippet}
  </PokerQuestion>
{:else}
  {#if finished}<p role="status" tabindex="-1" bind:this={resultText}>You got {score} of {ROUND} right.</p>{/if}
  <button class="button primary" onclick={start}>{finished ? 'Go again' : 'Start'}</button>
  <DrillScore {record} />
{/if}
