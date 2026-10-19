<script lang="ts">
  import { openProgress, type DrillRecord } from '@chaalwise/core/progress';
  import { onDestroy, onMount, tick } from 'svelte';
  import { EMPTY_BOARD } from '../lib/chess';
  import { coordinateHint, randomSquare } from '../lib/drills';
  import Board, { type Mark } from './Board.svelte';
  import DrillScore from './DrillScore.svelte';

  const SECONDS = 30;

  /** Find the named square, or name the highlighted one. */
  let { mode = 'find' }: { mode?: 'find' | 'name' } = $props();

  let typed = $state('');
  let orientation = $state<'white' | 'black'>('white');
  let target = $state<string>();
  let score = $state(0);
  let left = $state(SECONDS);
  let hint = $state('');
  let marks = $state<Mark[]>([]);
  let records = $state<Record<string, Omit<DrillRecord, 'drillId'>>>({});
  let timer: ReturnType<typeof setInterval> | undefined;
  let drill = $state<HTMLElement>();
  let resultText = $state<HTMLElement>();
  let finished = $state(false);

  const drillId = $derived(`coordinates-${mode === 'name' ? 'name-' : ''}${orientation}`);

  onMount(async () => {
    const progress = await openProgress();
    records = await progress.drills();
    progress.close();
  });
  onDestroy(() => clearInterval(timer));

  async function start() {
    score = 0;
    left = SECONDS;
    finished = false;
    hint = '';
    marks = [];
    target = randomSquare(Math.random);
    // The whole board should be on screen for a timed drill, especially on a phone.
    drill?.scrollIntoView({ block: 'nearest' });
    const end = performance.now() + SECONDS * 1000;
    clearInterval(timer);
    timer = setInterval(() => {
      left = Math.max(0, Math.ceil((end - performance.now()) / 1000));
      if (left === 0) finish();
    }, 200);
    // Start removed the Start button: put keyboard users in the typed-square field.
    await tick();
    drill?.querySelector<HTMLInputElement>('input:not([type=radio])')?.focus({ preventScroll: true });
  }

  async function finish() {
    if (!target) return;
    clearInterval(timer);
    const final = score;
    target = undefined;
    finished = true;
    await tick();
    resultText?.focus();
    const progress = await openProgress();
    await progress.recordDrill(drillId, final, new Date());
    records = await progress.drills();
    progress.close();
  }

  /** Name mode: the learner types the highlighted square's name. */
  function submitName(event: SubmitEvent) {
    event.preventDefault();
    const square = typed.trim().toLowerCase();
    typed = '';
    if (!/^[a-h][1-8]$/.test(square)) {
      hint = 'Write a square like e4: the file letter, then the rank number.';
      return;
    }
    answer(square);
  }

  function onpick(square: string) {
    answer(square);
  }

  function answer(square: string) {
    if (!target) return;
    if (square === target) {
      score++;
      hint = '';
      marks = [{ orig: square, brush: 'green' }];
      target = randomSquare(Math.random, target);
    } else if (mode === 'name') {
      // Directions from the wrong name, without saying the right one.
      hint = coordinateHint(target, square, orientation).replace(target, 'The highlighted square');
    } else {
      hint = coordinateHint(target, square, orientation);
      marks = [{ orig: square, brush: 'red' }];
    }
  }
</script>

<div class="drill" bind:this={drill}>
  <div class="board-col">
    <Board
      fen={EMPTY_BOARD}
      {orientation}
      coordinates={false}
      marks={mode === 'find' ? marks : []}
      highlight={mode === 'name' && target ? [target] : []}
      highlightStyle="area"
      label={!target ? 'Empty chess board' : mode === 'find' ? `Empty chess board: find ${target}` : 'Empty chess board with one square highlighted'}
      onpick={target && mode === 'find' ? onpick : undefined}
    />
  </div>
  <div class="side">
    <!-- Always mounted, so screen readers announce the first target as well as the rest. -->
    <p class="target" aria-live="assertive">{mode === 'find' ? (target ?? '') : ''}</p>
    {#if target && mode === 'name'}
      <form class="name" onsubmit={submitName}>
        <label>
          <span>Name the highlighted square</span>
          <input bind:value={typed} autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="e.g. e4" />
        </label>
        <button class="button" type="submit" disabled={!typed.trim()}>Answer</button>
      </form>
    {/if}
    {#if target}
      <p class="label">{left} s left · {score} {mode === 'find' ? 'found' : 'named'}</p>
      <p class="hint" aria-live="polite">{hint}</p>
    {:else}
      <fieldset>
        <legend class="label">Sit behind</legend>
        <label><input type="radio" bind:group={orientation} value="white" /> White</label>
        <label><input type="radio" bind:group={orientation} value="black" /> Black</label>
      </fieldset>
      {#if finished}<p role="status" tabindex="-1" bind:this={resultText}>You {mode === 'find' ? 'found' : 'named'} {score} in {SECONDS} seconds.</p>{/if}
      <button class="button primary" onclick={start}>{finished ? 'Go again' : 'Start'}</button>
      <DrillScore record={records[drillId]} />
      <ul class="tips">
        <li>Files are letters, a to h, from White's left. Ranks are numbers, 1 to 8, from White's side.</li>
        <li>Say the file first, then the rank: e4 is the e-file, fourth rank.</li>
        <li>Light on right: the near right-hand corner is always a light square.</li>
      </ul>
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
      grid-template-columns: minmax(0, 480px) minmax(0, 1fr);
      align-items: start;
    }
  }
  .side {
    display: grid;
    gap: 12px;
    justify-items: start;
  }
  .target {
    font: 600 4rem/1 var(--mono);
    margin: 0;
  }
  .target:empty {
    display: none;
  }
  .name {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 8px 12px;
  }
  .name label {
    display: grid;
    gap: 4px;
    color: var(--ink-2);
  }
  .name input {
    font: 1.4rem var(--mono);
    width: 7ch;
    min-height: 44px;
    padding: 6px 10px;
    border: 1px solid var(--rule-strong);
    border-radius: 8px;
    background: var(--card);
    color: var(--ink);
  }
  .hint {
    min-height: 1.5em;
    color: var(--warn);
    margin: 0;
  }
  fieldset {
    border: 0;
    padding: 0;
    margin: 0;
    display: flex;
    gap: 16px;
    align-items: center;
  }
  legend {
    float: left;
    margin-right: 8px;
  }
  .tips {
    color: var(--ink-2);
    padding-left: 1.2em;
    margin: 0;
  }
</style>
