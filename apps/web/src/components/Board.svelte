<script lang="ts">
  import { Chessground } from 'chessground';
  import type { Api } from 'chessground/api';
  import type { Key } from 'chessground/types';
  import { onDestroy } from 'svelte';
  import 'chessground/assets/chessground.base.css';
  import 'chessground/assets/chessground.cburnett.css';
  import { legalDests, parseMoveText, toUci } from '../lib/chess';
  import './board.css';

  interface Props {
    fen: string;
    orientation?: 'white' | 'black';
    interactive?: boolean;
    lastMove?: string | undefined;
    label: string;
    /** Returns whether the move stands; if not, the board puts the piece back. */
    onmove?: (uci: string) => boolean;
  }

  let {
    fen,
    orientation = 'white',
    interactive = false,
    lastMove,
    label,
    onmove,
  }: Props = $props();

  const uid = $props.id();
  let el: HTMLDivElement;
  let cg: Api | undefined;
  let typed = $state('');
  let typedError = $state('');
  const turn = $derived(fen.split(' ')[1] === 'b' ? 'black' : 'white');

  const play = (uci: string) => {
    if (onmove?.(uci) === false) cg?.set({ fen });
  };

  // A new position starts with a clean typed-move field.
  $effect(() => {
    void fen;
    typedError = '';
  });

  $effect(() => {
    const config = {
      fen,
      orientation,
      turnColor: turn,
      lastMove: lastMove ? ([lastMove.slice(0, 2), lastMove.slice(2, 4)] as Key[]) : undefined,
      movable: {
        free: false,
        color: interactive ? turn : undefined,
        dests: interactive ? (legalDests(fen) as Map<Key, Key[]>) : new Map(),
        showDests: true,
        events: { after: (orig: Key, dest: Key) => play(toUci(fen, orig, dest)) },
      },
    } as const;
    if (cg) cg.set(config);
    else cg = Chessground(el, { ...config, coordinates: true, animation: { duration: 180 } });
  });

  onDestroy(() => cg?.destroy());

  function submitTyped(event: SubmitEvent) {
    event.preventDefault();
    const uci = parseMoveText(fen, typed);
    typedError = uci ? '' : `“${typed}” is not a legal move here.`;
    if (uci) {
      typed = '';
      play(uci);
    }
  }
</script>

<div class="board" bind:this={el} role="img" aria-label={label}></div>
{#if interactive}
  <form class="typed" onsubmit={submitTyped}>
    <label>
      <span>Or type your move</span>
      <input
        bind:value={typed}
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        placeholder="e.g. Nf3 or g1f3"
        aria-describedby="{uid}-error"
      />
    </label>
    <button class="button" type="submit" disabled={!typed.trim()}>Play</button>
    <p id="{uid}-error" class="error" aria-live="polite">{typedError}</p>
  </form>
{/if}

<style>
  .typed {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 8px 12px;
    margin-top: 12px;
    max-width: 480px;
  }
  label {
    display: grid;
    gap: 4px;
    flex: 1 1 200px;
    font-size: 0.9rem;
    color: var(--ink-2);
  }
  input {
    font: 1rem var(--mono);
    min-height: 44px;
    padding: 8px 12px;
    border: 1px solid var(--rule-strong);
    border-radius: 8px;
    background: var(--card);
    color: var(--ink);
  }
  .error {
    flex-basis: 100%;
    margin: 0;
    min-height: 1.5em;
    color: var(--fail);
    font-size: 0.9rem;
  }
</style>
