<script lang="ts">
  import { playBots, type Style } from '@chaalwise/poker/bots';
  import { deck, shuffle } from '@chaalwise/poker/cards';
  import { act, legalMoves, MIN_POINTS, newHand, nextHand, STARTING_POINTS, type Move, type Table } from '@chaalwise/poker/table';
  import { tick } from 'svelte';
  import { markMet } from '../../lib/meet';
  import { advise, review, type Decision } from '../../lib/poker/review';
  import { moveLabel, resultText } from '../../lib/poker/words';
  import TableView from './TableView.svelte';

  /**
   * Practice tables: hands heads-up against a computer opponent of a chosen style,
   * and after each hand a review of every decision: what you did, the odds at that
   * moment, and what the maths suggested. Practice points only.
   */
  const YOU = 0;
  const BOT = 1;
  const OPPONENTS: { style: Style; name: string; plays: string }[] = [
    { style: 'cautious', name: 'Cautious', plays: 'plays only strong hands and rarely raises. When it bets, believe it.' },
    { style: 'steady', name: 'Steady', plays: 'raises strong hands and folds weak ones to a bet.' },
    { style: 'bold', name: 'Bold', plays: 'plays many hands, bets often and sometimes bluffs. Call it down more lightly.' },
  ];
  const fresh = () => [
    { name: 'You', points: STARTING_POINTS, isBot: false },
    { name: 'Bot', points: STARTING_POINTS, isBot: true },
  ];

  let style = $state<Style>('steady');
  /** Show the maths before each decision, not only after the hand. */
  let showMaths = $state(false);
  // Raw: the engine copies tables with structuredClone, which cannot copy a reactive proxy.
  let table = $state.raw<Table>();
  let decisions = $state<Decision[]>([]);
  let tally = $state({ hands: 0, decisions: 0, agreed: 0 });
  let note = $state('');
  let heading = $state<HTMLElement>();

  const styles = $derived<Style[]>([style, style]);
  const advice = $derived(table && !table.result && showMaths ? advise(table, Math.random) : undefined);

  async function deal() {
    const cards = shuffle(deck(), Math.random);
    const short = table?.seats.some((s) => s.points < MIN_POINTS);
    note = short ? `A new table: one of you ran low, so both start again with ${STARTING_POINTS} points.` : '';
    table = playBots(table && !short ? nextHand(table, cards) : newHand(fresh(), 0, cards), styles, Math.random);
    decisions = [];
    await tick();
    heading?.focus();
  }

  function play(move: Move) {
    if (!table) return;
    decisions = [...decisions, review(table, move, Math.random, advice)];
    table = playBots(act(table, move), styles, Math.random);
    if (table.result) finished();
  }

  function finished() {
    tally = {
      hands: tally.hands + 1,
      decisions: tally.decisions + decisions.length,
      agreed: tally.agreed + decisions.filter((d) => d.agreed).length,
    };
    if (tally.hands === 1) markMet('poker/practice').catch(console.error);
  }

  const STREET = { preflop: 'Before the flop', flop: 'Flop', turn: 'Turn', river: 'River', showdown: 'Showdown' };
</script>

<div class="practice">
  <fieldset class="opponent" disabled={!!table && !table.result}>
    <legend>Your opponent</legend>
    {#each OPPONENTS as o (o.style)}
      <label><input type="radio" name="opponent" value={o.style} bind:group={style} /> <strong>{o.name}</strong>: {o.plays}</label>
    {/each}
  </fieldset>
  <label class="maths"><input type="checkbox" bind:checked={showMaths} /> Show the maths before each decision</label>
  <p class="maths-note">
    The maths uses your chance against any two cards. A bot that bets or raises usually holds better, so against a bet treat the chance as the most it could be.
  </p>

  {#if !table}
    <button class="button primary" type="button" onclick={deal}>Deal a hand</button>
  {:else}
    <h2 tabindex="-1" bind:this={heading}>Hand {tally.hands + (table.result ? 0 : 1)} against {OPPONENTS.find((o) => o.style === style)!.name}</h2>
    {#if note}<p class="note">{note}</p>{/if}
    <TableView {table} you={YOU} bot={BOT} />

    {#if !table.result}
      {#if advice}
        <p class="advice" data-testid="advice">{advice.why}</p>
      {/if}
      <div class="moves">
        {#each legalMoves(table) as move (move)}
          <button class="button" type="button" onclick={() => play(move)}>{moveLabel(table, move)}</button>
        {/each}
      </div>
    {:else}
      <div class="result" aria-live="polite">
        <p><strong>{resultText(table, YOU, BOT)}</strong></p>
        {#if decisions.length}
          <table class="review" data-testid="review">
            <caption>Your decisions, against the odds at the time</caption>
            <thead>
              <tr><th scope="col">When</th><th scope="col">You</th><th scope="col">Chance</th><th scope="col">Price</th><th scope="col">The maths</th></tr>
            </thead>
            <tbody>
              {#each decisions as d, i (i)}
                <tr class:agreed={d.agreed}>
                  <td>{STREET[d.street]}</td>
                  <td>{d.move}</td>
                  <td>{Math.round(d.equity)}%</td>
                  <td>{d.price ? `${d.price}%` : 'free'}</td>
                  <td>{d.agreed ? `✓ ${d.suggest}` : d.suggest}</td>
                </tr>
              {/each}
            </tbody>
          </table>
          {#each decisions.filter((d) => !d.agreed) as d, i (i)}
            <p class="why">{STREET[d.street]}: you chose {d.move}. {d.why}</p>
          {/each}
        {:else}
          <p class="why">The bot's move ended the hand before you had a decision to make.</p>
        {/if}
        <p class="tally" data-testid="tally">
          {tally.agreed} of {tally.decisions} decisions matched the maths over {tally.hands}
          {tally.hands === 1 ? 'hand' : 'hands'}. The maths counts your chance against any two cards. When the cautious or steady bot bets or raises, its cards
          are stronger than that, so your real chance is lower; against the bold bot it is closer.
        </p>
        <button class="button primary" type="button" onclick={deal}>Deal the next hand</button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .practice {
    max-width: 760px;
  }
  .opponent {
    border: 1px solid var(--rule);
    border-radius: 8px;
    padding: 12px 16px;
    margin: 0 0 12px;
    display: grid;
    gap: 8px;
  }
  .opponent legend {
    padding: 0 6px;
    font-weight: 700;
  }
  .maths {
    display: block;
    margin-bottom: 4px;
    color: var(--ink-2);
  }
  .maths-note {
    margin-bottom: 20px;
    color: var(--ink-2);
    font-size: 0.9rem;
  }
  .moves {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .advice,
  .result {
    border-left: 3px solid var(--accent);
    padding-left: 14px;
    margin: 16px 0;
  }
  .note,
  .why,
  .tally {
    color: var(--ink-2);
  }
  .review {
    border-collapse: collapse;
    width: 100%;
    margin: 12px 0;
    font-variant-numeric: tabular-nums;
  }
  .review caption {
    text-align: left;
    color: var(--ink-2);
    padding-bottom: 6px;
  }
  .review th,
  .review td {
    text-align: left;
    padding: 6px 8px;
    border-bottom: 1px solid var(--rule);
  }
  .review tr.agreed td:last-child {
    color: var(--pass);
  }
  h2:focus {
    outline: none;
  }
</style>
