<script lang="ts">
  import type { Lesson } from '@chaalwise/core/lesson';
  import { advance, answer, createPlayer, currentStep, giveUp, showHint, type Outcome, type Response } from '@chaalwise/core/player';
  import { tick, type Snippet } from 'svelte';
  import { EMPTY_BOARD, playUci, toFen, toSan } from '../lib/chess';
  import { coordinateHint } from '../lib/drills';
  import Board, { type Mark } from './Board.svelte';
  import PlayOut from './PlayOut.svelte';

  interface Props {
    lesson: Pick<Lesson, 'steps'>;
    onfinish: (outcomes: Record<string, Outcome>) => void;
    /** Called as each step is graded, so a long session is saved as it goes. */
    onstep?: (stepId: string, outcome: Outcome) => void;
    finished: Snippet<[Record<string, Outcome>]>;
  }

  let { lesson, onfinish, onstep, finished }: Props = $props();

  let state = $state(createPlayer());
  let feedback = $state<{ tone: 'pass' | 'warn' | 'fail'; text: string } | undefined>();
  let picked = $state<number | undefined>();
  let marks = $state<Mark[]>([]);
  /** The position after the answer is played, once revealed. */
  let after = $state<{ fen: string; move: string } | undefined>();
  let heading = $state<HTMLElement>();
  let continueButton = $state<HTMLButtonElement>();
  let hintText = $state<HTMLElement>();

  const step = $derived(currentStep(lesson, state));
  const total = $derived(lesson.steps.length);
  const fen = $derived.by(() => {
    if (!step || step.kind === 'read') return undefined;
    if (step.position) return toFen(step.position);
    return step.kind === 'square' ? EMPTY_BOARD : undefined;
  });

  function respond(response: Response) {
    if (!step || step.kind === 'read') return false;
    const result = answer(lesson, state, response);
    state = result.state;
    if (result.correct) feedback = { tone: 'pass', text: step.kind === 'play' ? 'Checkmate. Well played!' : 'You found it!' };
    else if (state.revealed) reveal();
    else feedback = { tone: 'warn', text: retryText(response) };
    if (state.revealed) graded(step.id);
    return result.correct;
  }

  /** The control the learner used has gone or is disabled: move focus to Continue. */
  async function graded(stepId: string) {
    onstep?.(stepId, state.outcomes[stepId]!);
    await tick();
    continueButton?.focus();
  }

  async function hint() {
    state = showHint(state);
    await tick();
    hintText?.focus();
  }

  function showAnswer() {
    state = giveUp(lesson, state);
    reveal();
    if (step) graded(step.id);
  }

  function retryText(response: Response) {
    if (step?.kind === 'square' && response.kind === 'square' && step.answers.length === 1) {
      return `${coordinateHint(step.answers[0]!, response.square, step.orientation ?? 'white')} Try again.`;
    }
    return step?.kind === 'play' ? 'Not this time. Try again.' : 'Not that one. Try again.';
  }

  function reveal() {
    if (step?.kind === 'move' && fen) {
      const move = step.answers[0]!;
      after = { fen: playUci(fen, move), move };
      feedback = { tone: 'fail', text: `The move was ${toSan(fen, move)}.` };
    } else if (step?.kind === 'choice') {
      feedback = { tone: 'fail', text: `The answer was “${step.options[step.answer]}”.` };
    } else if (step?.kind === 'square') {
      feedback = { tone: 'fail', text: `The square was ${step.answers[0]}.` };
      marks = [{ orig: step.answers[0]!, brush: 'green' }];
    } else if (step?.kind === 'play') {
      feedback = { tone: 'fail', text: 'Here is the idea for next time.' };
    }
  }

  function onmove(uci: string) {
    const correct = respond({ kind: 'move', move: uci });
    if (correct && fen) after = { fen: playUci(fen, uci), move: uci };
    return correct;
  }

  function pick(square: string) {
    const correct = respond({ kind: 'square', square });
    if (!state.revealed) marks = [{ orig: square, brush: 'red' }];
    else if (correct) marks = [{ orig: square, brush: 'green' }];
  }

  function choose(index: number) {
    picked = index;
    respond({ kind: 'choice', index });
  }

  async function next() {
    state = advance(lesson, state);
    feedback = picked = after = undefined;
    marks = [];
    // A plain copy: IndexedDB cannot store the reactive proxy.
    if (state.done) onfinish($state.snapshot(state.outcomes));
    await tick();
    heading?.focus();
  }
</script>

<section class="player" aria-label="Lesson" data-build={__BUILD_ID__}>
  {#if step}
    <p class="label">Step {state.index + 1} of {total}</p>
    <div class="layout" class:has-board={fen || step.kind === 'play'}>
      <h2 tabindex="-1" bind:this={heading}>
        {step.kind === 'read' ? step.text : step.prompt}
      </h2>
      {#if step.kind === 'play'}
        <div class="board-col">
          {#key state.index}
            <PlayOut {step} finished={state.revealed} onresult={(won) => respond({ kind: 'play', won })} />
          {/key}
        </div>
      {:else if fen}
        <div class="board-col">
          <!-- Square steps hide the coordinates, or the answer is written on the edge; chessground reads that only once, so rebuild. -->
          {#key step.kind === 'square'}
            <Board
              fen={after?.fen ?? fen}
              lastMove={after?.move}
              orientation={step.kind === 'move' || step.kind === 'square' ? step.orientation : undefined}
              interactive={step.kind === 'move' && !state.revealed}
              marks={state.revealed && step.kind === 'choice' && step.arrows
                ? [...marks, ...step.arrows.map((a) => ({ orig: a.slice(0, 2), dest: a.slice(2, 4), brush: 'yellow' as const }))]
                : marks}
              highlight={state.revealed && step.kind === 'choice' ? (step.highlight ?? []) : []}
              coordinates={step.kind !== 'square'}
              label={step.kind === 'move' && !state.revealed
                ? 'Chess board: make your move'
                : step.kind === 'square' && !state.revealed
                  ? 'Chess board: pick a square'
                  : 'Chess board'}
              {onmove}
              onpick={step.kind === 'square' && !state.revealed ? pick : undefined}
            />
          {/key}
        </div>
      {/if}
      <div class="rest">
        {#if step.kind === 'choice'}
          <div class="options">
            {#each step.options as option, i (i)}
              <button
                class="button option"
                class:correct={state.revealed && i === step.answer}
                class:wrong={picked === i && i !== step.answer}
                disabled={state.revealed}
                onclick={() => choose(i)}>{option}</button
              >
            {/each}
          </div>
        {/if}

        <div aria-live="polite">
          {#if feedback}<p class="feedback {feedback.tone}">{feedback.text}</p>{/if}
          {#if state.hintShown && !state.revealed && step.kind !== 'read'}
            <p class="hint" tabindex="-1" bind:this={hintText}>{step.hint}</p>
          {/if}
          {#if state.revealed && step.kind !== 'read'}<p class="explanation">
              {step.explanation}
            </p>{/if}
        </div>

        <div class="actions">
          {#if step.kind === 'read' || state.revealed}
            <button class="button primary" onclick={next} bind:this={continueButton}>
              {state.index + 1 === total ? 'Finish' : 'Continue'}
            </button>
          {:else}
            {#if step.hint && !state.hintShown}
              <button class="button" onclick={hint}>Hint</button>
            {/if}
            {#if state.attempts > 0}
              <button class="button" onclick={showAnswer}>Show the answer</button>
            {/if}
          {/if}
        </div>
      </div>
    </div>
  {:else if state.done}
    {@render finished(state.outcomes)}
  {/if}
</section>

<style>
  .player {
    display: grid;
    gap: 12px;
  }
  /* Phone: question, board, then answers. Wide: the board beside the text. */
  .layout {
    display: grid;
    gap: 16px 32px;
  }
  @media (min-width: 820px) {
    .layout.has-board {
      grid-template-columns: minmax(0, 480px) minmax(0, 1fr);
      grid-template-areas: 'board prompt' 'board rest';
      grid-template-rows: auto 1fr;
      align-items: start;
    }
    .has-board h2 {
      grid-area: prompt;
    }
    .has-board .board-col {
      grid-area: board;
    }
    .has-board .rest {
      grid-area: rest;
    }
  }
  h2 {
    font-size: clamp(1.4rem, 2.6vw, 1.8rem);
    margin: 0;
  }
  h2:focus {
    outline: none;
  }
  .options {
    display: grid;
    gap: 10px;
    margin-bottom: 16px;
  }
  .option {
    justify-content: flex-start;
    border-radius: var(--radius);
    font-weight: 500;
    text-align: left;
  }
  .option:disabled {
    opacity: 1;
    cursor: default;
  }
  .option.correct {
    border: 2px solid var(--pass);
    color: var(--pass);
    font-weight: 600;
  }
  .option.wrong {
    border: 2px solid var(--fail);
    color: var(--fail);
  }
  .feedback {
    font-weight: 600;
    margin-bottom: 8px;
  }
  .pass {
    color: var(--pass);
  }
  .warn {
    color: var(--warn);
  }
  .fail {
    color: var(--fail);
  }
  .hint {
    color: var(--ink-2);
    font-style: italic;
  }
  .hint:focus {
    outline: none;
  }
  .explanation {
    padding: 12px 16px;
    background: var(--tint);
    border-radius: var(--radius);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 8px;
  }
</style>
