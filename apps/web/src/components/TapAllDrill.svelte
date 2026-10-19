<script lang="ts">
  import { openProgress, type DrillRecord } from '@chaalwise/core/progress';
  import { onMount, tick } from 'svelte';
  import { logAttempt } from '../lib/attempts';
  import { turnOf } from '../lib/chess';
  import { DRILL_SKILL } from '../lib/profile-skills';
  import Board, { type Mark } from './Board.svelte';
  import DrillScore from './DrillScore.svelte';

  /**
   * A drill where the learner taps every square that fits (where a piece can
   * go, which pieces are loose). Five positions; a position counts if it is
   * cleared without a wrong tap.
   */
  interface Props {
    kind: 'piece-squares' | 'loose-pieces';
  }

  let { kind }: Props = $props();
  const drillId = $derived(kind);

  /** A fresh position: its question and the squares that answer it. The generators load only when the drill starts. */
  async function make() {
    const generate = await import('@chaalwise/teach/generate');
    if (kind === 'piece-squares') {
      const d = generate.pieceSquares(Math.random);
      return { fen: d.fen, prompt: `Tap every square the ${d.role} on ${d.square} can move to.`, targets: d.reachable };
    }
    const d = generate.loosePosition(Math.random);
    return { fen: d.fen, prompt: 'Tap every loose piece: a piece (not a pawn or king) that nothing defends, on either side.', targets: d.loose };
  }
  const ROUND = 5;

  let item = $state<{ fen: string; prompt: string; targets: string[] }>();
  let found = $state<string[]>([]);
  let wrong = $state<string[]>([]);
  let index = $state(0);
  let clean = $state(0);
  let finished = $state(false);
  let revealed = $state(false);
  let record = $state<Omit<DrillRecord, 'drillId'>>();
  let resultText = $state<HTMLElement>();
  let prompt = $state<HTMLElement>();

  const marks = $derived<Mark[]>([
    ...found.map((orig) => ({ orig, brush: 'green' as const })),
    ...wrong.map((orig) => ({ orig, brush: 'red' as const })),
    ...(revealed && item ? item.targets.filter((t) => !found.includes(t)).map((orig) => ({ orig, brush: 'yellow' as const })) : []),
  ]);
  const left = $derived(item ? item.targets.length - found.length : 0);

  onMount(async () => {
    const progress = await openProgress();
    record = (await progress.drills())[drillId];
    progress.close();
  });

  async function nextPosition() {
    item = await make();
    found = [];
    wrong = [];
    revealed = false;
    await tick();
    prompt?.focus();
  }

  async function start() {
    index = clean = 0;
    finished = false;
    await nextPosition();
  }

  function onpick(square: string) {
    if (!item || revealed || found.includes(square)) return;
    if (item.targets.includes(square)) found = [...found, square];
    else if (!wrong.includes(square)) wrong = [...wrong, square];
  }

  async function next() {
    if (!wrong.length && !revealed) clean++;
    logAttempt(DRILL_SKILL[kind], revealed ? 'missed' : wrong.length ? 'with-help' : 'first-try', 'drill');
    index++;
    if (index < ROUND) return nextPosition();
    item = undefined;
    finished = true;
    await tick();
    resultText?.focus();
    const progress = await openProgress();
    await progress.recordDrill(drillId, clean, new Date());
    record = (await progress.drills())[drillId];
    progress.close();
  }
</script>

{#if item}
  <div class="drill">
    <div class="board-col">
      <Board
        fen={item.fen}
        orientation={turnOf(item.fen)}
        coordinates
        {marks}
        label="Chess board: tap the squares"
        onpick={left && !revealed ? onpick : undefined}
      />
    </div>
    <div class="side">
      <p class="label">{index + 1} of {ROUND}</p>
      <h3 tabindex="-1" bind:this={prompt}>{item.prompt}</h3>
      <p class="label" aria-live="polite">
        {revealed ? `${left} shown` : left ? `${left} still to find` : 'All found'}{wrong.length ? ` · ${wrong.length} wrong` : ''}
      </p>
      <div class="actions">
        {#if left === 0 || revealed}
          <button class="button primary" onclick={next}>{index + 1 === ROUND ? 'Finish' : 'Next'}</button>
        {:else}
          <button class="button" onclick={() => (revealed = true)}>Show the rest</button>
        {/if}
      </div>
    </div>
  </div>
{:else}
  {#if finished}<p role="status" tabindex="-1" bind:this={resultText}>You cleared {clean} of {ROUND} positions without a wrong tap.</p>{/if}
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
      grid-template-columns: minmax(0, 480px) minmax(0, 1fr);
      align-items: start;
    }
  }
  .side {
    display: grid;
    gap: 12px;
    justify-items: start;
  }
  h3:focus {
    outline: none;
  }
  .actions {
    display: flex;
    gap: 10px;
  }
</style>
