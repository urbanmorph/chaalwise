<script lang="ts">
  import { planSentence } from '@chaalwise/core/plans';

  /**
   * A plan to use the idea this week: pick when (or write your own), see the
   * if-then sentence, and save it on this device. Not graded; skipping is fine.
   */
  interface Props {
    situations: string[];
    action: string;
    onsave: (text: string) => Promise<void>;
  }

  let { situations, action, onsave }: Props = $props();
  let picked = $state(0);
  let own = $state('');
  let saved = $state<'no' | 'saving' | 'yes' | 'failed'>('no');

  const OWN = -1;
  const situation = $derived(picked === OWN ? own : situations[picked]!);
  const sentence = $derived(situation.trim() ? planSentence(situation, action) : '');

  async function save() {
    saved = 'saving';
    try {
      await onsave(sentence);
      saved = 'yes';
    } catch (error) {
      console.error(error);
      saved = 'failed';
    }
  }
</script>

<fieldset class="plan">
  <legend class="sr-only">When</legend>
  {#each situations as text, i (i)}
    <label class="pill"><input type="radio" name="when" value={i} bind:group={picked} /> When {text}</label>
  {/each}
  <label class="pill own">
    <input type="radio" name="when" value={OWN} bind:group={picked} /> Something else:
    <input type="text" aria-label="When, in your own words" placeholder="I …" bind:value={own} onfocus={() => (picked = OWN)} />
  </label>
</fieldset>

<p class="sentence" aria-live="polite">{sentence}</p>
<div class="save">
  <button class="button primary" type="button" disabled={!sentence || saved === 'saving'} onclick={save}>
    {saved === 'yes' ? 'Save the change' : 'Save my plan'}
  </button>
  <p class="status" aria-live="polite">
    {saved === 'yes'
      ? 'Saved on this device. Next time you review, you will be asked whether you used it.'
      : saved === 'failed'
        ? 'Could not save on this device. Try again.'
        : 'Kept on this device only.'}
  </p>
</div>

<style>
  .plan {
    display: grid;
    gap: 8px;
    border: 0;
    padding: 0;
    margin: 0 0 12px;
  }
  .pill {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border: 1px solid var(--rule-strong);
    border-radius: var(--radius);
    cursor: pointer;
  }
  .own input[type='text'] {
    flex: 1;
    min-width: 0;
    font: inherit;
    padding: 4px 8px;
    border: 1px solid var(--rule-strong);
    border-radius: var(--radius);
    background: var(--paper);
    color: var(--ink);
  }
  .sentence {
    font-weight: 600;
    min-height: 1.5em;
  }
  .save {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 16px;
  }
  .status {
    color: var(--ink-2);
    margin: 0;
  }
</style>
