<script lang="ts">
  import { deck, shuffle } from '@chaalwise/poker/cards';
  import { playBots } from '@chaalwise/poker/bots';
  import { evaluate } from '@chaalwise/poker/evaluate';
  import { outs, ruleOf } from '@chaalwise/poker/odds';
  import { act, legalMoves, newHand, toCall, type Move, type Table } from '@chaalwise/poker/table';
  import { tick } from 'svelte';
  import { markMet } from '../../lib/meet';
  import { BOT, coachFor, GUIDED, LEARNER, learnerTurn, PLAYERS, startGuided, step } from '../../lib/poker/guided';
  import { moveLabel, resultText } from '../../lib/poker/words';
  import TableView from './TableView.svelte';

  /**
   * Poker's front door: three guided hands, then three on your own against a
   * steady bot. After that, poker is met and its questions open up.
   */
  const FREE = 3;
  const RANKINGS = [
    ['Straight flush', 'five in a row, all one suit'],
    ['Four of a kind', 'four cards of one rank'],
    ['Full house', 'three of a kind and a pair'],
    ['Flush', 'five of one suit'],
    ['Straight', 'five in a row'],
    ['Three of a kind', 'three cards of one rank'],
    ['Two pair', 'two different pairs'],
    ['A pair', 'two cards of one rank'],
    ['High card', 'none of the above: the highest card counts'],
  ];

  let phase = $state<'start' | 'hand' | 'done'>('start');
  let index = $state(0);
  // Raw: the engine copies tables with structuredClone, which cannot copy a reactive proxy; each move replaces the table whole.
  let table = $state.raw<Table>();
  let heading = $state<HTMLElement>();
  let doneHeading = $state<HTMLElement>();

  const guided = $derived(index < GUIDED.length);
  const hand = $derived(guided ? GUIDED[index] : undefined);
  const coach = $derived(table && !table.result ? (hand ? coachFor(table, hand) : freeCoach(table)) : undefined);
  const free = $derived(index - GUIDED.length + 1);

  function freeCoach(t: Table): { notice: string; suggest?: Move; why: string } {
    const hole = t.seats[LEARNER]!.cards;
    if (t.board.length < 3) return { notice: 'Before the flop: only your two cards so far.', why: 'Play strong or connected cards; fold weak ones.' };
    const made = evaluate([...hole, ...t.board]).name;
    const draw = t.street === 'flop' || t.street === 'turn' ? outs(hole, t.board) : undefined;
    const drawing =
      draw && draw.count && draw.drawing !== 'pair or better'
        ? ` You also have ${draw.count} outs to a ${draw.drawing}: about ${ruleOf(draw.count, t.street === 'flop' ? 2 : 1)}%.`
        : '';
    return { notice: `You have ${made}.${drawing}`, why: toCall(t) ? `Calling costs ${toCall(t)} points.` : 'Nothing to call: checking is free.' };
  }

  async function deal() {
    phase = 'hand';
    table = guided
      ? learnerTurn(startGuided(index), GUIDED[index]!)
      : playBots(newHand(PLAYERS, index % 2, shuffle(deck(), Math.random)), ['steady', 'steady'], Math.random);
    await tick();
    heading?.focus();
  }

  function play(move: Move) {
    if (!table) return;
    table = hand ? learnerTurn(step(table, move), hand) : playBots(act(table, move), ['steady', 'steady'], Math.random);
  }

  async function next() {
    if (index + 1 >= GUIDED.length + FREE) return finish();
    index++;
    await deal();
  }

  async function finish() {
    phase = 'done';
    await markMet('poker/first-hands');
    await tick();
    doneHeading?.focus();
  }
</script>

<div class="first-hands">
  <section class="play" aria-label="Practice table">
    {#if phase === 'start'}
      <p class="lead">
        Three guided hands against a bot, with a coach at every decision, then three on your own. Practice points are free and can never be bought, sold or
        cashed out.
      </p>
      <div class="actions">
        <button class="button primary" type="button" onclick={deal}>Deal the first hand</button>
        <button class="button" type="button" onclick={finish}>I already play poker</button>
      </div>
    {:else if phase === 'hand' && table}
      <h2 tabindex="-1" bind:this={heading}>{hand ? `Hand ${index + 1}: ${hand.title}` : `On your own: hand ${free} of ${FREE}`}</h2>
      {#if hand}<p class="intro">{hand.intro}</p>{/if}

      <TableView {table} you={LEARNER} bot={BOT} />

      {#if coach}
        <div class="coach" data-testid="coach" aria-live="polite">
          <p>{coach.notice}</p>
          <p class="why">{coach.suggest ? `Suggested: ${moveLabel(table, coach.suggest).toLowerCase()}. ` : ''}{coach.why}</p>
        </div>
        <div class="moves">
          {#each legalMoves(table) as move (move)}
            <button class="button" class:primary={move === coach.suggest} class:suggested={move === coach.suggest} type="button" onclick={() => play(move)}
              >{moveLabel(table, move)}</button
            >
          {/each}
        </div>
      {:else if table.result}
        <div class="result" data-testid="result" aria-live="polite">
          <p><strong>{resultText(table, LEARNER, BOT)}</strong></p>
          {#if hand}<p>{hand.lesson}</p>{/if}
          <button class="button primary" type="button" onclick={next}>{index + 1 >= GUIDED.length + FREE ? 'Finish' : 'Next hand'}</button>
        </div>
      {/if}
    {:else}
      <h2 tabindex="-1" bind:this={doneHeading}>You have met poker</h2>
      <p>Its questions are now open to you across the site, starting with what beats what and how to count your outs.</p>
      <div class="actions">
        <a class="button primary" href="/reference/?game=poker">Look up poker ideas</a>
        <a class="button" href="/skills/">Back to strategy</a>
      </div>
    {/if}
  </section>

  <aside class="rankings" aria-labelledby="rankings-title">
    <h2 id="rankings-title">What beats what</h2>
    <ol>
      {#each RANKINGS as [name, what] (name)}<li><strong>{name}</strong>: {what}</li>{/each}
    </ol>
  </aside>
</div>

<style>
  .first-hands {
    display: grid;
    gap: 24px 40px;
  }
  @media (min-width: 900px) {
    .first-hands {
      grid-template-columns: minmax(0, 1fr) 280px;
      align-items: start;
    }
  }
  .play {
    min-height: 32rem;
  }
  .intro,
  .why {
    color: var(--ink-2);
  }
  .coach,
  .result {
    border-left: 3px solid var(--accent);
    padding-left: 14px;
    margin: 16px 0;
  }
  .moves,
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  h2:focus {
    outline: none;
  }
  .rankings ol {
    padding-left: 20px;
    margin: 0;
  }
  .rankings li {
    margin-bottom: 4px;
    color: var(--ink-2);
  }
</style>
