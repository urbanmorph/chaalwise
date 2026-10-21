<script lang="ts">
  import { markMet } from '../../lib/meet';
  import { tick } from 'svelte';
  import { average, BOX, drawRounds, offBy, PANEL, type PanelRound } from '../../lib/labs/panel';

  /**
   * Ask the panel: six boxes of dots to estimate with a panel of bots, three
   * alone and three after hearing a first voice. How far off one bot, an
   * independent panel and a panel that heard first are over many replays is
   * worked out at build time and passed in.
   */
  interface Props {
    typical: { one: number; alone: number; heard: number };
  }
  let { typical }: Props = $props();

  const NAMES = 'ABCDEFGH'.split('').slice(0, PANEL);

  interface Played extends PanelRound {
    yours: number;
  }

  let rounds = $state<PanelRound[]>([]);
  let played = $state<Played[]>([]);
  let guess = $state<number>();
  let showing = $state(false);
  let debrief = $state(false);
  let headEl = $state<HTMLElement>();
  let inputEl = $state<HTMLInputElement>();
  let statusEl = $state<HTMLElement>();
  let debriefEl = $state<HTMLElement>();

  const round = $derived(showing ? played.at(-1) : rounds[played.length]);
  const over = $derived(rounds.length > 0 && played.length === rounds.length);
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const meanOff = (rows: Played[], of: (r: Played) => number) => (rows.length ? rows.reduce((s, r) => s + offBy(of(r), r.dots), 0) / rows.length : 0);
  const split = $derived({ alone: played.filter((r) => !r.heard), heard: played.filter((r) => r.heard) });
  const panelAvg = (r: Played) => average(r.guesses);

  async function focus(el: () => HTMLElement | undefined) {
    await tick();
    el()?.focus();
  }

  function start() {
    [rounds, played, guess, showing, debrief] = [drawRounds(Math.random), [], undefined, false, false];
    focus(() => headEl);
  }

  function submit(event: SubmitEvent) {
    event.preventDefault();
    const r = rounds[played.length];
    if (!r || showing || !(typeof guess === 'number' && guess > 0)) return;
    played.push({ ...r, yours: Math.round(guess) });
    showing = true;
    // Played to the end: the lab is met, its questions open up in practice, and the progress page shows when.
    if (played.length === rounds.length) markMet('labs/ask-the-panel');
    focus(() => statusEl);
  }

  function next() {
    [guess, showing] = [undefined, false];
    focus(() => inputEl);
  }

  function showDebrief() {
    debrief = true;
    focus(() => debriefEl);
  }
</script>

<div class="lab card">
  <div class="lab-stage">
    {#if !round}
      <p>
        Each round shows a box of dots. You and a panel of {PANEL} bots each guess how many there are. Each bot is wrong by its own amount, some too high, some too
        low.
      </p>
      <p>
        In some rounds everyone guesses alone. In others, bot A speaks first and everyone hears its guess before making their own. Six boxes; after each, see
        your guess, the panel's average and the true count.
      </p>
      <p class="lab-note">
        Guess by eye: counting every dot is not the point. If you cannot see the picture, any number will do; the lesson is in the panel's averages.
      </p>
      <div class="lab-actions">
        <button class="button primary" type="button" onclick={start}>Start</button>
      </div>
    {:else}
      <h2 tabindex="-1" bind:this={headEl} data-testid="panel-round">Box {played.length + (showing ? 0 : 1)} of {rounds.length}</h2>
      <p class="condition" data-testid="panel-condition">
        {#if round.heard}
          Everyone hears a first voice this round. Bot A says: “About {round.guesses[0]}.”
        {:else}
          Everyone guesses alone this round: nobody hears anyone else first.
        {/if}
      </p>
      <svg class="dots" viewBox="0 0 {BOX.width} {BOX.height}" role="img" aria-label="A box of dots to estimate">
        {#each round.points as [x, y], i (i)}<circle cx={x} cy={y} r="2.6" />{/each}
      </svg>
      {#if !showing}
        <form class="guess" onsubmit={submit}>
          <label for="panel-guess">Your guess: how many dots?</label>
          <div class="lab-actions">
            <input id="panel-guess" type="number" inputmode="numeric" min="1" max="5000" step="1" required bind:value={guess} bind:this={inputEl} />
            <button class="button primary" type="submit">Guess</button>
          </div>
        </form>
      {:else}
        {@const r = played.at(-1)!}
        {@const avg = average(r.guesses)}
        <ul class="panel" aria-label="The panel's guesses">
          {#each r.guesses as g, i (i)}<li><span>Bot {NAMES[i]}</span> {g}</li>{/each}
        </ul>
        <p class="lab-status" tabindex="-1" bind:this={statusEl} aria-live="polite" data-testid="panel-result">
          There were {r.dots} dots. You said {r.yours}, off by {pct(offBy(r.yours, r.dots))}. The panel's average was {avg}, off by {pct(offBy(avg, r.dots))};
          {r.guesses.filter((g) => offBy(g, r.dots) > offBy(avg, r.dots)).length} of {PANEL} bots were further off than that.
        </p>
        <div class="lab-actions">
          {#if !over}
            <button class="button primary" type="button" onclick={next}>Next box</button>
          {:else}
            <button class="button primary" type="button" onclick={showDebrief} disabled={debrief}>See the debrief</button>
            <button class="button" type="button" onclick={start}>Play again</button>
          {/if}
        </div>
      {/if}
    {/if}
  </div>
</div>

{#if debrief}
  <section class="lab-debrief" data-testid="panel-debrief">
    <h2 tabindex="-1" bind:this={debriefEl}>Debrief</h2>
    <div class="lab-scroll">
      <table class="lab-table">
        <thead><tr><th>Box</th><th>Panel</th><th class="num">Dots</th><th class="num">You</th><th class="num">Panel average</th></tr></thead>
        <tbody>
          {#each played as r, i (i)}
            <tr>
              <td>{i + 1}</td>
              <td>{r.heard ? 'Heard bot A first' : 'Alone'}</td>
              <td class="num">{r.dots}</td>
              <td class="num">{r.yours} ({pct(offBy(r.yours, r.dots))} off)</td>
              <td class="num you">{panelAvg(r)} ({pct(offBy(panelAvg(r), r.dots))} off)</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p data-testid="panel-summary">
      Guessing alone, the panel's average was off by {pct(meanOff(split.alone, panelAvg))} on average; after hearing bot A first, by {pct(
        meanOff(split.heard, panelAvg),
      )}. Your own guesses were off by {pct(meanOff(split.alone, (r) => r.yours))} when you guessed alone and {pct(meanOff(split.heard, (r) => r.yours))} after hearing
      bot A.
    </p>
    <p>
      Six boxes are few, and luck plays a part. Over thousands of replays of this panel, one bot on its own is off by about {pct(typical.one)}. The average of
      eight bots guessing alone is off by about {pct(typical.alone)}. The average of eight who heard bot A first is off by about {pct(typical.heard)}: bot A's
      error is in every guess, so it does not cancel.
    </p>
    <h3>What it shows</h3>
    <ul class="lab-lesson">
      <li>
        Independent guesses are each wrong in their own way, so in an average the errors partly cancel. The average usually beats most of the people in it: the
        wisdom of crowds.
      </li>
      <li>
        Hearing a first number pulls every later guess towards it: anchoring. Its error is then repeated rather than cancelled, and the group feels surer than
        it should.
      </li>
      <li>
        In a meeting, have everyone write their estimate down before anyone speaks, then share them all at once. Hear the most senior person last, not first.
      </li>
      <li>Averaging cannot fix an error everyone shares. It works when people err in different directions.</li>
    </ul>
  </section>
{/if}

<style>
  .lab-stage {
    min-height: 32rem;
  }
  h2 {
    margin: 0;
  }
  .condition {
    margin: 0;
    font-weight: 600;
  }
  .dots {
    display: block;
    width: 100%;
    max-width: 540px;
    height: auto;
    border: 1px solid var(--rule-strong);
    border-radius: var(--radius);
    background: var(--paper);
    fill: var(--ink);
  }
  .guess label {
    display: block;
    font-weight: 600;
    margin-bottom: 6px;
  }
  input {
    width: 8em;
    min-height: 44px;
    padding: 8px 12px;
    border: 1px solid var(--rule-strong);
    border-radius: var(--radius);
    background: var(--paper);
    color: var(--ink);
    font: 600 1.1rem var(--sans);
  }
  .panel {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
    margin: 0;
    padding: 0;
    list-style: none;
    font-variant-numeric: tabular-nums;
  }
  .panel span {
    color: var(--ink-2);
  }
</style>
