<script lang="ts">
  import { openProgress, type DrillRecord } from '@chaalwise/core/progress';
  import { onMount, tick } from 'svelte';
  import { logAttempt } from '../../lib/attempts';
  import { count } from '../../lib/count';
  import { pokerItem, ROUND, type PokerDrillKind, type PokerItem } from '../../lib/poker/drills';
  import { DRILL_SKILL } from '../../lib/profile-skills';
  import DrillScore from '../DrillScore.svelte';
  import TableCards from './TableCards.svelte';

  /** A round of ten poker exercises of one kind, dealt and checked by the engine. */
  let { kind }: { kind: PokerDrillKind } = $props();

  const drillId = $derived(`poker-${kind}`);

  let item = $state<PokerItem>();
  let index = $state(0);
  let score = $state(0);
  let playing = $state(false);
  let finished = $state(false);
  let given = $state<number>();
  let typed = $state<number | null>(null);
  let record = $state<Omit<DrillRecord, 'drillId'>>();
  let side = $state<HTMLElement>();
  let nextButton = $state<HTMLButtonElement>();
  let resultText = $state<HTMLElement>();

  const right = $derived(given !== undefined && given === item?.answer);

  onMount(async () => {
    const progress = await openProgress();
    record = (await progress.drills())[drillId];
    progress.close();
  });

  /** Deal the next exercise, after the page has had a moment to show the last answer gone (equity takes a moment to work out). */
  async function deal() {
    given = undefined;
    typed = null;
    item = undefined;
    await new Promise((resolve) => setTimeout(resolve));
    item = pokerItem(kind);
    await tick();
    side?.querySelector<HTMLElement>('input, .choices button')?.focus({ preventScroll: true });
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

  function submitNumber(event: SubmitEvent) {
    event.preventDefault();
    if (typed !== null && Number.isInteger(typed) && typed >= 0) answer(typed);
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
  <div class="drill">
    <div class="cards-col">
      {#if item}<TableCards cards={item.cards} />{:else}<p class="label">Dealing…</p>{/if}
    </div>
    <div class="side" bind:this={side}>
      <p class="label">{index + 1} of {ROUND} · {score} right</p>
      {#if item}
        <h3>{item.prompt}</h3>
        {#if item.options}
          <div class="choices">
            {#each item.options as option, i (option)}
              <button
                class="button"
                class:correct={given !== undefined && i === item.answer}
                class:wrong={given === i && i !== item.answer}
                disabled={given !== undefined}
                onclick={() => answer(i)}>{option}</button
              >
            {/each}
          </div>
        {:else}
          <form class="number" onsubmit={submitNumber}>
            <label>
              <span>Your answer</span>
              <input type="number" inputmode="numeric" min="0" max="47" bind:value={typed} disabled={given !== undefined} />
            </label>
            <button class="button" type="submit" disabled={given !== undefined || typed === null}>Answer</button>
          </form>
        {/if}
        {#if given !== undefined}
          <p class="feedback" class:pass={right} class:fail={!right} role="status">
            {right ? 'Right.' : 'Not quite.'}
            {item.explanation}
          </p>
          <button class="button primary" onclick={next} bind:this={nextButton}>{index + 1 === ROUND ? 'Finish' : 'Next'}</button>
        {/if}
      {/if}
    </div>
  </div>
{:else}
  {#if finished}<p role="status" tabindex="-1" bind:this={resultText}>You got {score} of {ROUND} right.</p>{/if}
  <button class="button primary" onclick={start}>{finished ? 'Go again' : 'Start'}</button>
  <DrillScore {record} />
{/if}

<style>
  .drill {
    display: grid;
    gap: 20px;
  }
  @media (min-width: 820px) {
    .drill {
      grid-template-columns: minmax(0, 400px) minmax(0, 1fr);
      align-items: start;
    }
  }
  .side {
    display: grid;
    gap: 12px;
    justify-items: start;
  }
  .side h3 {
    margin: 0;
  }
  .choices {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  /* As in the lesson player: once answered, the right and wrong choices stay clear, not faded. */
  .choices button:disabled {
    opacity: 1;
    cursor: default;
  }
  .choices .correct {
    border: 2px solid var(--pass);
    color: var(--pass);
    font-weight: 600;
  }
  .choices .wrong {
    border: 2px solid var(--fail);
    color: var(--fail);
  }
  .number {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 8px 12px;
  }
  .number label {
    display: grid;
    gap: 4px;
    color: var(--ink-2);
  }
  .number input {
    font: 1.4rem var(--mono);
    width: 6ch;
    min-height: 44px;
    padding: 6px 10px;
    border: 1px solid var(--rule-strong);
    border-radius: 8px;
    background: var(--card);
    color: var(--ink);
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
