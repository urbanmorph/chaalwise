<script lang="ts">
  import { journalId, localDay, type JournalEntry } from '@chaalwise/core/journal';
  import { onMount } from 'svelte';
  import { shortDate } from '../lib/short-date';
  import { withProgress } from '../lib/with-progress';

  /**
   * The decision journal on the progress page: one short form for a decision before it is
   * made, and every entry, newest first. Kept on this device only, and in its progress file.
   */
  const WEEK = 7 * 86_400_000;
  const isoDay = (at: Date) => `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')}`;

  let entries = $state<JournalEntry[]>([]);
  let deciding = $state('');
  let expect = $state('');
  let sure = $state<number>();
  let lookBack = $state(isoDay(new Date(Date.now() + WEEK)));
  let message = $state('Kept on this device only. On that date, review asks how it went.');

  const newestFirst = $derived([...entries].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
  const JUDGED = { sound: 'sound, given what you knew', unsound: 'not sound, given what you knew', unsure: 'not sure' };

  async function load() {
    entries = await withProgress((p) => p.journal());
  }

  onMount(() => load().catch(console.error));

  async function save(event: SubmitEvent) {
    event.preventDefault();
    const now = new Date();
    try {
      await withProgress((p) =>
        p.writeJournal({
          id: journalId('decision', now),
          kind: 'decision',
          createdAt: now,
          deciding: deciding.trim(),
          expect: expect.trim(),
          sure: sure!,
          lookBackOn: localDay(lookBack),
        }),
      );
      deciding = expect = '';
      sure = undefined;
      message = `Saved on this device. Review asks how it went on ${shortDate(localDay(lookBack))}.`;
      await load();
    } catch (error) {
      console.error(error);
      message = 'Could not save on this device. Try again.';
    }
  }

  async function remove(id: string) {
    try {
      await withProgress((p) => p.deleteJournal(id));
      await load();
    } catch (error) {
      console.error(error);
    }
  }
</script>

<div class="journal" data-testid="journal">
  <form class="card" onsubmit={save}>
    <h3>Write down a decision before you make it</h3>
    <label>What are you deciding? <input type="text" required bind:value={deciding} placeholder="Whether to …" /></label>
    <label>What do you expect to happen? <input type="text" required bind:value={expect} /></label>
    <div class="row">
      <label>How sure are you? (%) <input type="number" required min="0" max="100" step="5" bind:value={sure} /></label>
      <label>When will you look back? <input type="date" required min={isoDay(new Date())} bind:value={lookBack} /></label>
    </div>
    <button class="button primary" type="submit">Save to my journal</button>
    <p class="status" aria-live="polite">{message}</p>
  </form>

  {#if newestFirst.length}
    <ul class="entries">
      {#each newestFirst as entry (entry.id)}
        <li class="card">
          {#if entry.kind === 'decision'}
            <p><strong>{entry.deciding}</strong></p>
            <p>You expected: {entry.expect} ({entry.sure}% sure). Written {shortDate(entry.createdAt)}.</p>
            {#if entry.lookedBack}
              <p>What happened: {entry.lookedBack.happened}</p>
              <p>Judged: {JUDGED[entry.lookedBack.judged]}.</p>
            {:else}
              <p class="when">Look back on {shortDate(entry.lookBackOn)}</p>
            {/if}
          {:else}
            <p><strong>After {entry.title}</strong>, {shortDate(entry.createdAt)}</p>
            {#if entry.same}<p>Do the same: {entry.same}</p>{/if}
            {#if entry.change}<p>Change: {entry.change}</p>{/if}
          {/if}
          <button class="button delete" type="button" onclick={() => remove(entry.id)}>Delete</button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .journal {
    display: grid;
    gap: 16px;
  }
  form {
    display: grid;
    gap: 12px;
  }
  h3 {
    margin: 0;
  }
  label {
    display: grid;
    gap: 4px;
  }
  .row {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
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
  .status,
  .when {
    color: var(--ink-2);
    margin: 0;
  }
  .entries {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 12px;
  }
  .entries p {
    margin: 0 0 6px;
  }
  .delete {
    margin-top: 6px;
  }
</style>
