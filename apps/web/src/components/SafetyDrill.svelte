<script lang="ts">
  import { openProgress, type DrillRecord } from '@chaalwise/core/progress';
  import { onMount, tick } from 'svelte';
  import { turnOf } from '../lib/chess';
  import type { SafetyItem } from '../lib/lessons';
  import { logAttempt } from '../lib/attempts';
  import { DRILL_SKILL } from '../lib/profile-skills';
  import { shuffle } from '../lib/random';
  import Board from './Board.svelte';
  import DrillScore from './DrillScore.svelte';

  const ROUND = 10;

  let { items }: { items: SafetyItem[] } = $props();

  let round = $state<SafetyItem[]>([]);
  let index = $state(0);
  let score = $state(0);
  let answered = $state<boolean | undefined>();
  let record = $state<Omit<DrillRecord, 'drillId'>>();
  let nextButton = $state<HTMLButtonElement>();
  let resultText = $state<HTMLElement>();

  const item = $derived(round[index]);

  onMount(async () => {
    const progress = await openProgress();
    record = (await progress.drills()).safety;
    progress.close();
  });

  function start() {
    round = shuffle(items).slice(0, ROUND);
    index = score = 0;
    answered = undefined;
  }

  async function answer(safe: boolean) {
    answered = safe === item!.safe;
    if (answered) score++;
    logAttempt(DRILL_SKILL.safety, answered ? 'first-try' : 'missed', 'drill');
    await tick();
    nextButton?.focus();
  }

  async function next() {
    answered = undefined;
    index++;
    if (index < round.length) return;
    // Finish removed the focused button: move focus to the result.
    await tick();
    resultText?.focus();
    const progress = await openProgress();
    await progress.recordDrill('safety', score, new Date());
    record = (await progress.drills()).safety;
    progress.close();
  }
</script>

{#if item}
  <div class="drill">
    <div class="board-col">
      <Board
        fen={item.fen}
        orientation={turnOf(item.fen)}
        marks={[{ orig: item.uci.slice(0, 2), dest: item.uci.slice(2, 4), brush: 'blue' }]}
        label="Chess board with the move shown as an arrow"
      />
    </div>
    <div class="side">
      <p class="label">{index + 1} of {round.length} · {turnOf(item.fen) === 'white' ? 'White' : 'Black'} to move</p>
      <h3>Is {item.san} safe?</h3>
      {#if answered === undefined}
        <div class="actions">
          <button class="button" onclick={() => answer(true)}>Safe</button>
          <button class="button" onclick={() => answer(false)}>Not safe</button>
        </div>
      {:else}
        <p class="feedback" class:pass={answered} class:fail={!answered} role="status">
          {answered ? 'Right.' : 'Not quite.'}
          {item.text}
        </p>
        <button class="button primary" onclick={next} bind:this={nextButton}>{index + 1 === round.length ? 'Finish' : 'Next'}</button>
      {/if}
    </div>
  </div>
{:else}
  {#if round.length}<p role="status" tabindex="-1" bind:this={resultText}>You judged {score} of {round.length} moves correctly.</p>{/if}
  <button class="button primary" onclick={start}>{round.length ? 'Go again' : 'Start'}</button>
  <DrillScore {record} />
{/if}

<style>
  .drill {
    display: grid;
    gap: 20px;
  }
  @media (min-width: 820px) {
    .drill {
      grid-template-columns: minmax(0, 480px) minmax(0, 1fr);
      align-items: start;
    }
  }
  .side {
    display: grid;
    gap: 12px;
    justify-items: start;
  }
  .actions {
    display: flex;
    gap: 10px;
  }
  .feedback {
    margin: 0;
  }
  .pass {
    color: var(--pass);
  }
  .fail {
    color: var(--fail);
  }
</style>
