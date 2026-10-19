<script lang="ts">
  import { Chessground } from 'chessground';
  import type { Api } from 'chessground/api';
  import type { DrawShape } from 'chessground/draw';
  import type { Key } from 'chessground/types';
  import { onDestroy } from 'svelte';
  import 'chessground/assets/chessground.base.css';
  import 'chessground/assets/chessground.cburnett.css';
  import { arrowPoints, type Point } from '../lib/arrows';
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
    /** Squares to shade, e.g. the square a question was about. */
    highlight?: string[];
    /** Letters and numbers along the edges; off in the coordinates drill. */
    coordinates?: boolean;
    label: string;
    /** Returns whether the move stands; if not, the board puts the piece back. */
    onmove?: (uci: string) => boolean;
    /** Square-picking mode: called with the square the learner chooses. */
    onpick?: (square: string) => void;
  }

  let {
    fen,
    orientation = 'white',
    interactive = false,
    typing = false,
    lastMove,
    marks = [],
    highlight = [],
    coordinates = true,
    label,
    onmove,
    onpick,
  }: Props = $props();

  const uid = $props.id();
  let el: HTMLDivElement;
  let cg: Api | undefined;
  let typed = $state('');
  let typedError = $state('');
  const turn = $derived(turnOf(fen));
  const moving = $derived(interactive && !!onmove && !onpick);

  /** Arrow colours, chosen to show on both square colours of the green board. */
  const ARROW_COLOURS: Record<Mark['brush'], string> = { green: '#0f5132', red: '#c0262d', blue: '#1f5fd1', yellow: '#c96a04' };

  /** Each arrow's line, stopped short of the target square's centre so the head sits inside it. */
  const arrows = $derived(
    marks
      .filter((m): m is Mark & { dest: string } => !!m.dest)
      .map((m) => {
        const points = arrowPoints(m.orig, m.dest, orientation);
        const [px, py] = points.at(-2)!;
        const [ex, ey] = points.at(-1)!;
        const length = Math.hypot(ex - px, ey - py);
        const end: Point = [ex - ((ex - px) / length) * 0.22, ey - ((ey - py) / length) * 0.22];
        return { brush: m.brush, points: [...points.slice(0, -1), end] };
      }),
  );

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
      highlight: { lastMove: true, check: true, custom: new Map(highlight.map((square) => [square as Key, 'highlight'])) },
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
    // Circles are chessground's; arrows are drawn by the overlay below, so knight moves can turn.
    const shapes: DrawShape[] = marks.filter((m) => !m.dest).map((m) => ({ orig: m.orig as Key, brush: m.brush }));
    cg?.setAutoShapes(shapes);
  });

  // chessground remembers where the board is on the page and re-measures only on scroll or resize.
  // Content appearing above the board (the update banner, a longer question) moves it without either,
  // and in Safari a tap then lands a rank off. Re-measure just before chessground handles each press.
  const remeasure = () => cg?.state.dom.bounds.clear();
  $effect(() => {
    el.addEventListener('mousedown', remeasure, { capture: true });
    el.addEventListener('touchstart', remeasure, { capture: true, passive: true });
    return () => {
      el.removeEventListener('mousedown', remeasure, { capture: true });
      el.removeEventListener('touchstart', remeasure, { capture: true });
    };
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

<div class="frame">
  <div class="board" bind:this={el} role="img" aria-label={label}></div>
  {#if arrows.length}
    <svg class="arrows" viewBox="0 0 8 8" aria-hidden="true">
      <defs>
        {#each Object.entries(ARROW_COLOURS) as [brush, colour] (brush)}
          <marker id="{uid}-head-{brush}" viewBox="0 0 4 4" refX="2" refY="2" markerWidth="3.4" markerHeight="3.4" orient="auto">
            <path d="M0,0 L4,2 L0,4 Z" fill={colour} />
          </marker>
        {/each}
      </defs>
      {#each arrows as arrow, i (i)}
        <polyline points={arrow.points.map((p) => p.join(',')).join(' ')} stroke={ARROW_COLOURS[arrow.brush]} marker-end="url(#{uid}-head-{arrow.brush})" />
      {/each}
    </svg>
  {/if}
</div>
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
  .frame {
    position: relative;
    width: 100%;
    max-width: 480px;
  }
  .arrows {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 3;
  }
  .arrows polyline {
    fill: none;
    stroke-width: 0.2;
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0.9;
  }
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
