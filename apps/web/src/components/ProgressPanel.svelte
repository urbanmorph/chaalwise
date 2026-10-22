<script lang="ts">
  import { openProgress, requestPersistence } from '@chaalwise/core/progress';
  import { onMount } from 'svelte';
  import { exportDaily, importDaily } from '../lib/daily';
  import { saveDone } from '../lib/done-lessons';
  import { labHref, labsPlayed, playedLabel } from '../lib/labs/labs';
  import { exportResume, importResume } from '../lib/resume';

  interface Props {
    /** Review questions the site still has; any others (from changed lessons) are not counted. */
    cardIds: string[];
  }

  let { cardIds }: Props = $props();
  const known = $derived(new Set(cardIds));

  let stats = $state<{ lessons: number; cards: number; due: number } | undefined>();
  // Every lab from the start, "Not yet" until the record is read, so nothing shifts.
  let labs = $state(labsPlayed([]));
  // Assumed not yet kept, so the warning is laid out from the start and nothing shifts.
  let persisted = $state(false);
  let pending = $state<{ name: string; data: unknown } | undefined>();
  let message = $state('');
  let fileInput = $state<HTMLInputElement>();

  async function load() {
    const progress = await openProgress();
    try {
      const now = new Date();
      const data = await progress.exportData(now);
      const due = (await progress.dueCards(now)).filter((c) => known.has(c.id));
      // Playing a lab is kept as a finished record, to remember the game is met; it is not a lesson.
      stats = { lessons: data.lessons.filter((l) => !l.lessonId.startsWith('labs/')).length, cards: data.cards.length, due: due.length };
      labs = labsPlayed(data.lessons);
    } finally {
      progress.close();
    }
  }

  onMount(async () => {
    try {
      await load();
    } catch (error) {
      console.error(error);
      message = 'Your progress could not be read on this device.';
    }
    persisted = (await navigator.storage?.persisted?.()) ?? false;
  });

  async function exportFile() {
    const progress = await openProgress();
    // The place in each unfinished lesson and the daily streak go too, so another device carries on from there.
    const data = { ...(await progress.exportData(new Date())), resume: exportResume(), daily: exportDaily() };
    progress.close();
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const link = Object.assign(document.createElement('a'), {
      href: url,
      download: `chaalwise-progress-${new Date().toISOString().slice(0, 10)}.json`,
    });
    link.click();
    // Revoked later: revoking straight away can cancel the download in some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function chooseFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // so choosing the same file again still works
    if (!file) return;
    try {
      pending = { name: file.name, data: JSON.parse(await file.text()) };
      message = '';
    } catch {
      message = 'That file is not a Chaalwise progress file.';
    }
  }

  async function importFile() {
    if (!pending) return;
    const { name, data } = pending;
    pending = undefined;
    try {
      const progress = await openProgress();
      try {
        await progress.importData(data);
        saveDone(await progress.completedLessons());
        const { resume, daily } = data as { resume?: unknown; daily?: unknown };
        importResume(resume);
        importDaily(daily);
      } finally {
        progress.close();
      }
      message = `Progress loaded from ${name}.`;
      await load();
    } catch {
      message = 'That file is not a Chaalwise progress file. Nothing was changed.';
    }
    fileInput?.focus();
  }

  async function keep() {
    persisted = await requestPersistence();
  }
</script>

<div class="grid">
  <section class="card">
    <h2>On this device</h2>
    <!-- The same layout before and after loading, so nothing shifts. -->
    <dl aria-busy={!stats}>
      <div>
        <dt>Lessons finished</dt>
        <dd data-testid="lessons-finished">{stats?.lessons ?? '–'}</dd>
      </div>
      <div>
        <dt>Review questions</dt>
        <dd>{stats?.cards ?? '–'}</dd>
      </div>
      <div>
        <dt>Due today</dt>
        <dd>{stats?.due ?? '–'}</dd>
      </div>
    </dl>
    {#if !persisted}
      <p>
        Your browser may clear this progress if you do not visit for a while (Safari does after seven days). Installing Chaalwise to your home screen, or
        allowing storage, keeps it.
      </p>
      <button class="button" onclick={keep}>Keep my progress</button>
    {:else}
      <p>Your browser will keep this progress.</p>
    {/if}
  </section>

  <section class="card">
    <h2>Labs played</h2>
    <dl aria-busy={!stats}>
      {#each labs as lab (lab.slug)}
        <div data-testid="lab-played-{lab.slug}">
          <dt><a href={labHref(lab)}>{lab.title}</a></dt>
          <dd class="when">{playedLabel(lab.at, lab.times)}</dd>
        </div>
      {/each}
    </dl>
  </section>

  <section class="card">
    <h2>Move it to another device</h2>
    <p>Your progress never leaves this device on its own. Save it as a file, and load that file on another device.</p>
    <button class="button primary" onclick={exportFile}>Save progress to a file</button>
    <label class="file">
      <span>Load a progress file</span>
      <input type="file" accept="application/json,.json" onchange={chooseFile} bind:this={fileInput} />
    </label>
    {#if pending}
      <p>Loading <strong>{pending.name}</strong> replaces the progress on this device.</p>
      <button class="button" onclick={importFile}>Replace my progress</button>
    {/if}
    <p role="status">{message}</p>
  </section>
</div>

<style>
  .grid {
    display: grid;
    gap: 20px;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
  }
  dl {
    display: grid;
    gap: 8px;
    margin: 0 0 16px;
  }
  dl div {
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid var(--rule);
    padding-bottom: 6px;
  }
  dd {
    margin: 0;
    font: 600 1.1rem var(--mono);
  }
  dd.when {
    font-size: 0.95rem;
  }
  .file {
    display: grid;
    gap: 6px;
    margin-top: 16px;
    color: var(--ink-2);
  }
</style>
