<script lang="ts">
  import type { Step } from '@chaalwise/core/lesson';
  import { advance, answer, createPlayer, currentStep, giveUp, isGraded, jumpTo, showHint, type Outcome, type Response } from '@chaalwise/core/player';
  import { tick, type Snippet } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { EMPTY_BOARD, playUci, toFen, toSan } from '../lib/chess';
  import { squareHint } from '../lib/drills';
  import { shuffle } from '../lib/random';
  import { CONFIDENCE } from '@chaalwise/core/calibration';
  import Board, { type Mark } from './Board.svelte';
  import PlanStep from './PlanStep.svelte';
  import PlayOut from './PlayOut.svelte';
  import TableCards from './poker/TableCards.svelte';

  interface Props {
    lesson: { steps: Step[] };
    onfinish: (outcomes: Record<string, Outcome>) => void;
    /** Called as each step is graded, so a long session is saved as it goes, with how sure the learner said they were. */
    onstep?: (stepId: string, outcome: Outcome, confidence?: number) => void;
    /** Offer "how sure are you?" before each answer (practice and review, not first lessons). */
    askConfidence?: boolean;
    /** Where each step comes from, such as "In chess", for rounds that mix lessons. */
    contexts?: (string | undefined)[];
    finished: Snippet<[Record<string, Outcome>]>;
    /** Saves the learner's plan from a plan step; plan steps show only where this is given. */
    onplan?: (stepId: string, text: string) => Promise<void>;
    /** Called as the learner moves on or answers, with the step reached and the answers so far, to keep their place. */
    onprogress?: (index: number, outcomes: Record<string, Outcome>) => void;
  }

  let { lesson, onfinish, onstep, finished, onplan, onprogress, askConfidence = false, contexts = [] }: Props = $props();
  /** Arrows on the board: shown with a reading step at once, and with a choice once it is answered. */
  const arrowMarks = (arrows: string[], brush: Mark['brush']): Mark[] => arrows.map((a) => ({ orig: a.slice(0, 2), dest: a.slice(2, 4), brush }));
  /** How sure the learner said they were, chosen before the first answer only. */
  let sure = $state<number>();

  let player = $state(createPlayer());
  let feedback = $state<{ tone: 'pass' | 'warn' | 'fail'; text: string } | undefined>();
  let picked = $state<number | undefined>();
  let marks = $state<Mark[]>([]);
  /** The position after the answer is played, once revealed. */
  let after = $state<{ fen: string; move: string } | undefined>();
  let heading = $state<HTMLElement>();
  let continueButton = $state<HTMLButtonElement>();
  let hintText = $state<HTMLElement>();
  /** Steps the learner has been through, for the step dots (read steps have no grade to show it). */
  const seen = new SvelteSet<number>();

  const step = $derived(currentStep(lesson, player));
  // Options in a fresh order each time a question is shown, so where the answer sits gives nothing away.
  const order = $derived(step?.kind === 'choice' ? shuffle(step.options.map((_, i) => i)) : []);
  const total = $derived(lesson.steps.length);
  // Square steps hide the coordinates unless asked, or the answer is written on the edge.
  const showCoordinates = $derived(step?.kind !== 'square' || !!step.coordinates);

  /** A poker step's cards, shown where a chess step shows its board. */
  const cards = $derived(step && (step.kind === 'read' || step.kind === 'choice') ? step.cards : undefined);

  const fen = $derived.by(() => {
    if (!step || step.kind === 'plan' || (step.kind === 'read' && !step.position)) return undefined;
    if (step.position) return toFen(step.position);
    return step.kind === 'square' ? EMPTY_BOARD : undefined;
  });

  function respond(response: Response) {
    if (!step || !isGraded(step)) return false;
    const isNew = !(step.id in player.outcomes);
    const result = answer(lesson, player, response);
    player = result.state;
    if (result.correct) feedback = { tone: 'pass', text: step.kind === 'play' ? 'Checkmate. Well played!' : 'You found it!' };
    else if (player.revealed) reveal();
    else feedback = { tone: 'warn', text: retryText(response) };
    if (player.revealed) graded(step.id, isNew);
    return result.correct;
  }

  /** The control the learner used has gone or is disabled: move focus to Continue. */
  async function graded(stepId: string, isNew: boolean) {
    // Saved once: a step is graded the first time it is answered.
    if (isNew) onstep?.(stepId, player.outcomes[stepId]!, sure);
    progressed();
    await tick();
    continueButton?.focus();
  }

  async function hint() {
    player = showHint(player);
    await tick();
    hintText?.focus();
  }

  function showAnswer() {
    const isNew = !!step && !(step.id in player.outcomes);
    player = giveUp(lesson, player);
    reveal();
    if (step) graded(step.id, isNew);
  }

  function retryText(response: Response) {
    if (step?.kind === 'square' && response.kind === 'square') {
      const hint = squareHint(step.answers, response.square, step.orientation ?? 'white');
      if (hint) return `${hint} Try again.`;
    }
    if (step?.kind === 'choice' && response.kind === 'choice' && step.feedback?.[response.index]) return `${step.feedback[response.index]} Try again.`;
    return step?.kind === 'play' ? 'Not this time. Try again.' : 'Not that one. Try again.';
  }

  function reveal() {
    if (step?.kind === 'move' && fen) {
      const move = step.answers[0]!;
      after = { fen: playUci(fen, move), move };
      feedback = { tone: 'fail', text: `The move was ${toSan(fen, move)}.` };
    } else if (step?.kind === 'choice') {
      const why = picked === undefined ? undefined : step.feedback?.[picked];
      feedback = { tone: 'fail', text: `${why ? `${why} ` : ''}The answer was “${step.options[step.answer]}”.` };
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
    if (!player.revealed) marks = [{ orig: square, brush: 'red' }];
    else if (correct) marks = [{ orig: square, brush: 'green' }];
  }

  function choose(index: number) {
    picked = index;
    respond({ kind: 'choice', index });
  }

  function clearStep() {
    feedback = picked = after = sure = undefined;
    marks = [];
  }

  /** A plain copy of the answers so far: storage cannot keep the reactive proxy. */
  const answers = () => $state.snapshot(player.outcomes);
  const progressed = () => onprogress?.(player.index, answers());

  /** Show the new step from the top, with focus on it. */
  async function shown() {
    clearStep();
    await tick();
    heading?.focus();
  }

  /** The step dots: go straight to any step. */
  function goTo(index: number) {
    seen.add(player.index);
    player = jumpTo(lesson, player, index);
    progressed();
    return shown();
  }

  /** Carry on where the learner left off: that step, with the answers so far kept and the steps before it seen. */
  export function resume(index: number, outcomes: Record<string, Outcome>) {
    for (let i = 0; i < index; i++) seen.add(i);
    player = jumpTo(lesson, { ...createPlayer(), outcomes }, index);
    return shown();
  }

  function next() {
    seen.add(player.index);
    player = advance(lesson, player);
    if (player.done) onfinish(answers());
    else progressed();
    return shown();
  }
</script>

<section class="player" aria-label="Lesson" data-build={__BUILD_ID__}>
  {#if step}
    <nav class="steps" aria-label="Steps in this lesson">
      <ol>
        {#each lesson.steps as s, i (s.id)}
          <li>
            <button
              type="button"
              class:done={s.id in player.outcomes || seen.has(i)}
              class:missed={player.outcomes[s.id] === 'missed'}
              aria-current={i === player.index ? 'step' : undefined}
              aria-label="Step {i + 1}{s.id in player.outcomes ? ', done' : ''}"
              onclick={() => goTo(i)}>{i + 1}</button
            >
          </li>
        {/each}
      </ol>
      <p class="label">Step {player.index + 1} of {total}</p>
    </nav>
    <div class="layout" class:has-board={fen || step.kind === 'play' || cards}>
      <h2 tabindex="-1" bind:this={heading} class:reading={step.kind === 'read'}>
        {#if contexts[player.index]}<span class="label context" data-testid="question-context">{contexts[player.index]}:</span>{/if}
        {step.kind === 'read' ? step.text : step.prompt}
      </h2>
      {#if step.kind === 'play'}
        <div class="board-col">
          {#key player.index}
            <PlayOut {step} finished={player.revealed} onresult={(won) => respond({ kind: 'play', won })} />
          {/key}
        </div>
      {:else if cards}
        <div class="board-col">
          <TableCards {cards} />
        </div>
      {:else if fen}
        <div class="board-col">
          <!-- chessground reads the coordinates setting only once, so rebuild the board when it changes. -->
          {#key showCoordinates}
            <Board
              fen={after?.fen ?? fen}
              lastMove={after?.move}
              orientation={'orientation' in step ? step.orientation : undefined}
              interactive={step.kind === 'move' && !player.revealed}
              marks={step.kind === 'read' && step.arrows
                ? arrowMarks(step.arrows, 'green')
                : player.revealed && step.kind === 'choice' && step.arrows
                  ? [...marks, ...arrowMarks(step.arrows, 'yellow')]
                  : marks}
              highlight={step.kind === 'read' ? (step.highlight ?? []) : player.revealed && step.kind === 'choice' ? (step.highlight ?? []) : []}
              highlightStyle={step.kind === 'read' ? 'area' : 'outline'}
              coordinates={showCoordinates}
              label={step.kind === 'move' && !player.revealed
                ? 'Chess board: make your move'
                : step.kind === 'square' && !player.revealed
                  ? 'Chess board: pick a square'
                  : 'Chess board'}
              {onmove}
              onpick={step.kind === 'square' && !player.revealed ? pick : undefined}
            />
          {/key}
        </div>
      {/if}
      <div class="rest">
        {#if askConfidence && isGraded(step) && !player.revealed}
          <fieldset class="sure" disabled={player.attempts > 0}>
            <legend>How sure are you? <span class="optional">Optional</span></legend>
            <div class="choices">
              {#each CONFIDENCE as level (level)}
                <label><input type="radio" name="sure-{player.index}" value={level} bind:group={sure} /> {level * 100}%</label>
              {/each}
            </div>
          </fieldset>
        {/if}
        {#if step.kind === 'plan' && onplan}
          {#key player.index}
            <PlanStep situations={step.situations} action={step.action} onsave={(text) => onplan(step.id, text)} />
          {/key}
        {/if}
        {#if step.kind === 'choice' && step.alongside}
          <div class="alongside">
            <p class="label">{cards ? 'Away from the table' : 'Off the board'}</p>
            <p>{step.alongside}</p>
          </div>
        {/if}
        {#if step.kind === 'choice'}
          <div class="options">
            {#each order as i (i)}
              <button
                class="button option"
                class:correct={player.revealed && i === step.answer}
                class:wrong={picked === i && i !== step.answer}
                disabled={player.revealed}
                onclick={() => choose(i)}>{step.options[i]}</button
              >
            {/each}
          </div>
        {/if}

        <div aria-live="polite">
          {#if feedback}<p class="feedback {feedback.tone}">{feedback.text}</p>{/if}
          {#if player.hintShown && !player.revealed && isGraded(step)}
            <p class="hint" tabindex="-1" bind:this={hintText}>{step.hint}</p>
          {/if}
          {#if player.revealed && isGraded(step)}<p class="explanation">
              {step.explanation}
            </p>{/if}
        </div>

        <div class="actions">
          {#if !isGraded(step) || player.revealed}
            <button class="button primary" onclick={next} bind:this={continueButton}>
              {player.index + 1 === total ? 'Finish' : 'Continue'}
            </button>
          {:else}
            {#if step.hint && !player.hintShown}
              <button class="button" onclick={hint}>Hint</button>
            {/if}
            {#if player.attempts > 0}
              <button class="button" onclick={showAnswer}>Show the answer</button>
            {/if}
          {/if}
        </div>
      </div>
    </div>
  {:else if player.done}
    {@render finished(player.outcomes)}
  {/if}
</section>

<style>
  .alongside {
    border-left: 3px solid var(--accent);
    padding: 4px 0 4px 14px;
    margin-bottom: 14px;
  }
  .alongside p {
    margin: 0 0 4px;
  }
  .sure {
    border: 0;
    padding: 0;
    margin: 0 0 12px;
  }
  .sure legend {
    font-size: 0.9rem;
    color: var(--ink-2);
    margin-bottom: 6px;
  }
  .optional {
    font-size: 0.8rem;
  }
  .player {
    display: grid;
    gap: 12px;
  }
  /* Phone: question, board, then answers. Wide: the board beside the text. */
  .steps {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 16px;
  }
  .steps ol {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .steps button {
    min-width: 32px;
    min-height: 32px;
    border-radius: 999px;
    border: 1px solid var(--rule-strong);
    background: var(--paper);
    color: var(--ink-2);
    font: 600 0.8rem var(--mono);
    cursor: pointer;
  }
  .steps button.done {
    background: var(--primary);
    border-color: var(--primary);
    color: var(--on-primary);
  }
  .steps button.missed {
    background: var(--paper);
    border-color: var(--fail);
    color: var(--fail);
  }
  .steps button[aria-current='step'] {
    outline: 2px solid var(--focus);
    outline-offset: 2px;
  }
  .steps .label {
    margin: 0;
  }
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
  /* Where a mixed round's question comes from, read with it: "In chess: …". */
  .context {
    display: block;
    margin-bottom: 6px;
  }
  /* A read step is a paragraph to read, not a question: body text, not a headline. */
  h2.reading {
    font-size: 1.15rem;
    font-weight: 500;
    line-height: 1.6;
    letter-spacing: 0;
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
