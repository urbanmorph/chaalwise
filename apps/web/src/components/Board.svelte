<script lang="ts">
  import { Chessground } from 'chessground';
  import type { Api } from 'chessground/api';
  import type { DrawShape } from 'chessground/draw';
  import type { Key } from 'chessground/types';
  import { onDestroy } from 'svelte';
  import 'chessground/assets/chessground.base.css';
  import 'chessground/assets/chessground.cburnett.css';
  import { legalDests, parseMoveText, toUci, turnOf } from '../lib/chess';
  import './board.css';

  export interface Mark {
    orig: string;
    /** With a destination it is an arrow; without, a circle. */
    dest?: string;
    brush: 'green' | 'red' | 'blue' | 'yellow';
  }

  interface Props {
    fen: string;
    orientation?: 'white' | 'black';
    /** Moves can be made (needs onmove). */
    interactive?: boolean;
    /** Keep the typed-move field while moves are paused (e.g. waiting for the computer), so keyboard focus stays put. */
    typing?: boolean;
    lastMove?: string | undefined;
    marks?: Mark[];
    /** Letters and numbers along the edges; off in the coordinates drill. */
    coordinates?: boolean;
    label: string;
    /** Returns whether the move stands; if not, the board puts the piece back. */
    onmove?: (uci: string) => boolean;
    /** Square-picking mode: called with the square the learner chooses. */
    onpick?: (square: string) => void;
  }

  let { fen, orientation = 'white', interactive = false, typing = false, lastMove, marks = [], coordinates = true, label, onmove, onpick }: Props = $props();

  const uid = $props.id();
  let el: HTMLDivElement;
  let cg: Api | undefined;
  let typed = $state('');
  let typedError = $state('');
  const turn = $derived(turnOf(fen));
  const moving = $derived(interactive && !!onmove && !onpick);

  const play = (uci: string) => {
    if (onmove?.(uci) === false) cg?.set({ fen });
  };

  // A new position starts with a clean typed field.
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
        color: moving ? turn : undefined,
        dests: moving ? (legalDests(fen) as Map<Key, Key[]>) : new Map(),
        showDests: true,
        events: { after: (orig: Key, dest: Key) => play(toUci(fen, orig, dest)) },
      },
      draggable: { enabled: !onpick },
      events: { select: (key: Key) => onpick?.(key) },
    } as const;
    if (cg) cg.set(config);
    else cg = Chessground(el, { ...config, coordinates, animation: { duration: 180 } });
  });

  $effect(() => {
    const shapes: DrawShape[] = marks.map((m) => ({
      orig: m.orig as Key,
      dest: m.dest as Key | undefined,
      brush: m.brush,
    }));
    cg?.setAutoShapes(shapes);
  });

  onDestroy(() => cg?.destroy());

  function submitTyped(event: SubmitEvent) {
    event.preventDefault();
    const text = typed.trim();
    if (onpick) {
      const square = text.toLowerCase();
      typedError = /^[a-h][1-8]$/.test(square) ? '' : `“${text}” is not a square. Write it like e4.`;
      if (!typedError) onpick(square);
    } else if (!moving) {
      typedError = 'Wait for the reply, then move.';
    } else {
      const uci = parseMoveText(fen, text);
      typedError = uci ? '' : `“${text}” is not a legal move here.`;
      if (uci) play(uci);
    }
    if (!typedError) typed = '';
  }
</script>

<div class="board" bind:this={el} role="img" aria-label={label}></div>
{#if moving || onpick || (typing && onmove)}
  <form class="typed" onsubmit={submitTyped}>
    <label>
      <span>{onpick ? 'Or type the square' : 'Or type your move'}</span>
      <input
        bind:value={typed}
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        placeholder={onpick ? 'e.g. e4' : 'e.g. Nf3 or g1f3'}
        aria-describedby="{uid}-error"
      />
    </label>
    <button class="button" type="submit" disabled={!typed.trim()}>{onpick ? 'Pick' : 'Play'}</button>
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
