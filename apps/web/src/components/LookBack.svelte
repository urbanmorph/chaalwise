<script lang="ts">
  import { toLookBack, type DecisionEntry, type Judgement } from '@chaalwise/core/journal';
  import { onMount } from 'svelte';
  import { withProgress } from '../lib/with-progress';

  /**
   * On its date, the review looks back at a decision from the journal: what happened,
   * then a judgement of the decision by what was known at the time, and only then what
   * was expected beside what happened, so the result cannot colour the judgement.
   */
  let entry = $state<DecisionEntry>();
  let happened = $state('');
  let asked = $state<'happened' | 'judge' | 'compare'>('happened');

  onMount(async () => {
    try {
      entry = toLookBack(await withProgress((p) => p.journal()), new Date());
    } catch (error) {
      console.error(error);
    }
  });

  async function judge(judged: Judgement) {
    const looked = { ...entry!, lookedBack: { at: new Date(), happened: happened.trim(), judged } };
    try {
      await withProgress((p) => p.writeJournal(looked));
    } catch (error) {
      console.error(error);
    }
    entry = looked;
    asked = 'compare';
  }
</script>

{#if entry}
  <section class="card look-back" aria-labelledby="look-back-title" data-testid="look-back">
    <h2 id="look-back-title">Look back at a decision</h2>
    <p class="deciding">You were deciding: {entry.deciding}</p>
    {#if asked === 'happened'}
      <form
        onsubmit={(event) => {
          event.preventDefault();
          asked = 'judge';
        }}
      >
        <label>What happened? <input type="text" required bind:value={happened} /></label>
        <button class="button primary" type="submit">Next</button>
      </form>
    {:else if asked === 'judge'}
      <p>
        Now judge the decision, not the result. Think back to what you knew, and could reasonably have found out, when you decided. Was it a sound choice, by
        what you knew then?
      </p>
      <div class="actions">
        <button class="button" type="button" onclick={() => judge('sound')}>Sound, given what I knew</button>
        <button class="button" type="button" onclick={() => judge('unsound')}>Not sound: I knew enough to choose better</button>
        <button class="button" type="button" onclick={() => judge('unsure')}>Not sure</button>
      </div>
    {:else}
      <div aria-live="polite">
        <p>You expected: {entry.expect} ({entry.sure}% sure).</p>
        <p>What happened: {entry.lookedBack?.happened}</p>
        <p>
          A sound decision can turn out badly, and a poor one can turn out well. What you wrote at the time shows what you really expected; memory would have
          moved it towards the result. Saved in your journal. More in the lesson <a href="/skills/review-calmly/">Review calmly: decisions, not results</a>.
        </p>
      </div>
    {/if}
  </section>
{/if}

<style>
  .look-back {
    margin-top: 32px;
    border-left: 4px solid var(--accent);
  }
  .deciding {
    font-weight: 600;
  }
  form {
    display: grid;
    gap: 12px;
  }
  label {
    display: grid;
    gap: 4px;
  }
  input {
    font: inherit;
    padding: 6px 8px;
    border: 1px solid var(--rule-strong);
    border-radius: var(--radius);
    background: var(--paper);
    color: var(--ink);
  }
  form .button {
    justify-self: start;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
