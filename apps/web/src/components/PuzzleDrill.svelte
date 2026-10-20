<script lang="ts">
  import { openProgress, type DrillRecord } from '@chaalwise/core/progress';
  import { onMount, tick } from 'svelte';
  import { logAttempt } from '../lib/attempts';
  import { begin, move, puzzlesFor, THEMES, type Band, type PuzzleState, type Theme } from '../lib/puzzles';
  import { shuffle } from '../lib/random';
  import Board from './Board.svelte';

  /**
   * Puzzles by theme, from the Lichess puzzle database: ten at a time at a chosen
   * level. A wrong move shows the right one and counts as missed; the opponent's
   * replies are played for you. Progress stays on this device.
   */
  const ROUND = 10;

  let { start = 'mateIn1' }: { start?: string } = $props();

  let theme = $state<Theme>(THEMES[0]!);
  let band = $state<Band>(THEMES[0]!.bands[0]!);
  let round = $state<PuzzleState[]>([]);
  let index = $state(0);
  let current = $state.raw<PuzzleState>();
  let missed = $state(false);
  let solved = $state(false);
  let score = $state(0);
  let loading = $state(false);
  let records = $state<Record<string, Omit<DrillRecord, 'drillId'>>>({});
  let status = $state<HTMLElement>();

  const drillId = $derived(`puzzles-${theme.id}`);
  const finished = $derived(round.length > 0 && index >= round.length);

  onMount(async () => {
    theme = THEMES.find((t) => t.id === new URLSearchParams(location.search).get('theme')) ?? THEMES.find((t) => t.id === start) ?? theme;
    const progress = await openProgress();
    records = await progress.drills();
    progress.close();
  });

  async function startRound() {
    loading = true;
    const puzzles = await puzzlesFor(theme.id, band);
    round = shuffle(puzzles).slice(0, ROUND).map(begin);
    index = score = 0;
    show();
    loading = false;
  }

  function show() {
    current = round[index];
    missed = solved = false;
  }

  function onmove(uci: string): boolean {
    if (!current || solved) return false;
    const { result, state: after } = move(current, uci);
    if (result === 'wrong') {
      if (!missed) logAttempt(theme.skill, 'missed', 'drill', { item: current.puzzle.id });
      missed = true;
      return false;
    }
    current = after;
    if (result === 'solved') {
      solved = true;
      if (!missed) score++;
      if (!missed) logAttempt(theme.skill, 'first-try', 'drill', { item: current.puzzle.id });
      tick().then(() => status?.focus());
    }
    return true;
  }

  function showAnswer() {
    if (!current) return;
    let s = current;
    // Play the rest of the line, so the learner sees how it ends.
    while (s.next < s.puzzle.moves.length) s = move(s, s.puzzle.moves[s.next]!).state;
    current = s;
    if (!missed) logAttempt(theme.skill, 'missed', 'drill', { item: s.puzzle.id });
    missed = solved = true;
    tick().then(() => status?.focus());
  }

  async function next() {
    index++;
    if (index < round.length) return show();
    const progress = await openProgress();
    await progress.recordDrill(drillId, score, new Date());
    records = await progress.drills();
    progress.close();
    await tick();
    status?.focus();
  }

  const best = $derived(records[drillId]?.best);
</script>

<div class="puzzles">
  <div class="choose">
    <label
      >Theme
      <select bind:value={theme} disabled={round.length > 0 && !finished}>
        {#each THEMES as t (t.id)}<option value={t}>{t.title}</option>{/each}
      </select>
    </label>
    <label
      >Level
      <select bind:value={band} disabled={round.length > 0 && !finished}>
        {#each theme.bands as b (b.min)}<option value={b}>{b.name}</option>{/each}
      </select>
    </label>
    {#if round.length === 0 || finished}
      <button class="button primary" type="button" onclick={startRound} disabled={loading}>{finished ? 'Another ten' : 'Start ten puzzles'}</button>
    {/if}
  </div>
  {#if best !== undefined}<p class="label">Your best for {theme.title.toLowerCase()}: {best} of {ROUND}</p>{/if}

  {#if current && !finished}
    <div class="drill">
      <div class="board-col">
        <Board
          fen={current.fen}
          orientation={current.side}
          lastMove={current.lastMove}
          interactive={!solved}
          {onmove}
          label="Chess board: find the best move"
        />
      </div>
      <div class="side">
        <p class="label">Puzzle {index + 1} of {round.length} · {current.side === 'white' ? 'White' : 'Black'} to play</p>
        <h3>{theme.title}: find the best move.</h3>
        <div aria-live="polite">
          {#if solved}
            <p class="feedback" class:pass={!missed} class:warn={missed} tabindex="-1" bind:this={status}>
              {missed ? 'The answer is played on the board. Look for this idea next time.' : 'Solved!'}
            </p>
          {:else if missed}
            <p class="feedback warn">Not that one. Try again, or show the answer.</p>
          {/if}
        </div>
        <div class="actions">
          {#if solved}
            <button class="button primary" type="button" onclick={next}>{index + 1 === round.length ? 'Finish' : 'Next puzzle'}</button>
          {:else}
            <button class="button" type="button" onclick={showAnswer}>Show the answer</button>
          {/if}
        </div>
        <p class="credit">Puzzle {current.puzzle.id} from the Lichess puzzle database, rated {current.puzzle.rating}.</p>
      </div>
    </div>
  {:else if finished}
    <p class="result" tabindex="-1" bind:this={status} data-testid="puzzle-result">{score} of {round.length} solved first time.</p>
  {/if}
</div>

<style>
  .choose {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 16px;
    align-items: end;
    margin-bottom: 12px;
  }
  label {
    display: grid;
    gap: 4px;
    color: var(--ink-2);
    font-size: 0.9rem;
  }
  select {
    font: inherit;
    min-height: 44px;
    padding: 6px 10px;
    border: 1px solid var(--rule-strong);
    border-radius: 8px;
    background: var(--card);
    color: var(--ink);
  }
  .drill {
    display: grid;
    gap: 20px 32px;
    margin-top: 16px;
  }
  @media (min-width: 800px) {
    .drill {
      grid-template-columns: minmax(0, 480px) 1fr;
      align-items: start;
    }
  }
  .actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }
  .credit {
    margin-top: 16px;
    color: var(--ink-2);
    font-size: 0.85rem;
  }
  .result {
    font-weight: 700;
    margin-top: 16px;
  }
  .feedback.pass {
    color: var(--pass);
  }
  .feedback.warn {
    color: var(--warn);
  }
</style>
