<script lang="ts">
  import { tick, type Snippet } from 'svelte';
  import type { PokerItem } from '../../lib/poker/drills';
  import TableCards from './TableCards.svelte';

  /**
   * One poker exercise: the cards, the question, choices or a number to type, and
   * once answered, whether it was right and why. Shared by the drills and today's
   * poker puzzle; the caller keeps the score and says what comes next.
   */
  interface Props {
    item: PokerItem | undefined;
    /** The answer given, or undefined while the question is open. */
    given: number | undefined;
    onanswer: (value: number) => void;
    /** A line above the question, such as "3 of 10 · 2 right". */
    label?: string;
    /** What follows an answer: Next, Finish, or a link onwards. */
    after?: Snippet;
    /** Move focus to each new question: right in a round, wrong on a page that has just opened. */
    focusEach?: boolean;
  }
  let { item, given, onanswer, label, after, focusEach = true }: Props = $props();

  let typed = $state<number | null>(null);
  let side = $state<HTMLElement>();
  const right = $derived(given !== undefined && given === item?.answer);

  // A new exercise starts empty, with focus on the answer in a round.
  $effect(() => {
    if (!item) return;
    typed = null;
    if (focusEach) tick().then(() => side?.querySelector<HTMLElement>('input, .choices button')?.focus({ preventScroll: true }));
  });

  function submitNumber(event: SubmitEvent) {
    event.preventDefault();
    if (typed !== null && Number.isInteger(typed) && typed >= 0) onanswer(typed);
  }
</script>

<div class="drill">
  <div class="cards-col">
    {#if item}<TableCards cards={item.cards} />{:else}<p class="label">Dealing…</p>{/if}
  </div>
  <div class="side" bind:this={side}>
    {#if label}<p class="label">{label}</p>{/if}
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
              onclick={() => onanswer(i)}>{option}</button
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
        {@render after?.()}
      {/if}
    {/if}
  </div>
</div>

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
