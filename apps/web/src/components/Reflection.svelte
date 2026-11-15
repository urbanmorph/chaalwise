<script lang="ts">
  import { journalId } from '@chaalwise/core/journal';
  import { withProgress } from '../lib/with-progress';

  /**
   * An optional reflection at the end of a lesson or lab: one thing to do the same, one to
   * change. Writing a few lines like this after the day's work helped trainees learn more
   * (Di Stefano et al., HBS); sharing them added nothing, so they stay on the device.
   */
  let { from, title }: { from: string; title: string } = $props();
  let same = $state('');
  let change = $state('');
  let saved = $state<'no' | 'yes' | 'failed'>('no');

  async function save(event: SubmitEvent) {
    event.preventDefault();
    const now = new Date();
    try {
      await withProgress((p) =>
        p.writeJournal({ id: journalId('reflection', now), kind: 'reflection', createdAt: now, from, title, same: same.trim(), change: change.trim() }),
      );
      saved = 'yes';
    } catch (error) {
      console.error(error);
      saved = 'failed';
    }
  }
</script>

<form class="reflection" onsubmit={save} data-testid="reflection">
  <h3>Look back on it <span class="optional">Optional</span></h3>
  <label>One thing you would do the same <input type="text" bind:value={same} disabled={saved === 'yes'} /></label>
  <label>One thing you would change <input type="text" bind:value={change} disabled={saved === 'yes'} /></label>
  {#if saved === 'yes'}
    <p class="status" aria-live="polite">Saved in your journal on this device. <a href="/progress/#journal">See your journal</a></p>
  {:else}
    <div class="save">
      <button class="button" type="submit" disabled={!same.trim() && !change.trim()}>Save to my journal</button>
      <p class="status" aria-live="polite">{saved === 'failed' ? 'Could not save on this device. Try again.' : 'Kept on this device only.'}</p>
    </div>
  {/if}
</form>

<style>
  .reflection {
    display: grid;
    gap: 12px;
    margin-top: 24px;
  }
  h3 {
    font-size: 1.1rem;
    margin: 0;
  }
  .optional {
    font-weight: 400;
    color: var(--ink-2);
    font-size: 0.9rem;
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
