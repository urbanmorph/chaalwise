<script lang="ts">
  import type { GradedStep } from '@chaalwise/core/lesson';
  import { openProgress, type DrillRecord } from '@chaalwise/core/progress';
  import { onMount } from 'svelte';
  import DrillScore from './DrillScore.svelte';
  import PlayOut from './PlayOut.svelte';

  /** Basic mates against the clock: a random start; the score is the moves left over when you mate (more is better). */
  let piece = $state<'queen' | 'rook'>('queen');
  let step = $state<Extract<GradedStep, { kind: 'play' }>>();
  let games = $state(0);
  let result = $state('');
  let records = $state<Record<string, Omit<DrillRecord, 'drillId'>>>({});

  const drillId = $derived(`mate-${piece}`);

  onMount(async () => {
    const progress = await openProgress();
    records = await progress.drills();
    progress.close();
  });

  async function start() {
    const { practiceStep } = await import('../lib/practice');
    step = practiceStep(piece === 'queen' ? 'mate-kq' : 'mate-kr', Math.random) as Extract<GradedStep, { kind: 'play' }>;
    result = '';
    games++;
  }

  async function onresult(won: boolean, used: number) {
    if (!step) return;
    const spare = won ? step.within - used : 0;
    result = won ? `Mate in ${used} moves, with ${spare} to spare.` : 'No mate this time.';
    const progress = await openProgress();
    await progress.recordDrill(drillId, spare, new Date());
    records = await progress.drills();
    progress.close();
  }
</script>

<div class="mate">
  <fieldset>
    <legend class="label">Mate with</legend>
    <label><input type="radio" bind:group={piece} value="queen" /> King and queen</label>
    <label><input type="radio" bind:group={piece} value="rook" /> King and rook</label>
  </fieldset>
  <button class="button primary" onclick={start}>{games ? 'New position' : 'Start'}</button>
  <DrillScore record={records[drillId]} />
  {#if step}
    {#key games}
      <PlayOut {step} finished={false} {onresult} />
    {/key}
    {#if result}<p role="status">{result}</p>{/if}
  {/if}
</div>

<style>
  .mate {
    display: grid;
    gap: 12px;
    justify-items: start;
  }
  fieldset {
    border: 0;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
  }
  legend {
    float: left;
    margin-right: 8px;
  }
</style>
