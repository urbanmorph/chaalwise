<script lang="ts">
  import { markMet } from '../../lib/meet';
  import { tick } from 'svelte';
  import { BIDDERS, botBid, breakEvenShade, drawItem, HIGH, LOW, settle, SPREAD, BOT_SHADE, type Item } from '../../lib/labs/auction';

  /** The sealed-bid auction lab: five jars of coins, one sealed bid each against four bots, then a debrief. */
  const JARS = 5;
  const NAMES = ['You', 'Bot 1', 'Bot 2', 'Bot 3', 'Bot 4'];

  interface Jar extends Item {
    bids: number[];
    winner: number;
    profit: number;
  }

  let jars = $state<Jar[]>([]);
  let item = $state<Item>();
  let revealed = $state(false);
  let bid = $state<number>();
  let debrief = $state(false);
  let inputEl = $state<HTMLInputElement>();
  let resultEl = $state<HTMLElement>();
  let debriefEl = $state<HTMLElement>();

  const last = $derived(jars.at(-1));
  const yours = $derived(jars.reduce((s, j) => s + (j.winner === 0 ? j.profit : 0), 0));
  const bots = $derived(jars.reduce((s, j) => s + (j.winner === 0 ? 0 : j.profit), 0));
  const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);
  const optimist = (j: Jar) => j.estimates[j.winner] === Math.max(...j.estimates);
  const cursed = $derived(jars.filter(optimist).length);
  const shade = $derived(jars.length ? jars.reduce((s, j) => s + j.estimates[0]! - j.bids[0]!, 0) / jars.length : 0);

  async function next() {
    [item, revealed, bid] = [drawItem(Math.random, BIDDERS), false, undefined];
    await tick();
    inputEl?.focus();
  }

  async function place(event: SubmitEvent) {
    event.preventDefault();
    if (!item || revealed || !(typeof bid === 'number' && bid >= 0)) return;
    const bids = [Math.round(bid), ...item.estimates.slice(1).map(botBid)];
    jars.push({ ...item, bids, ...settle(item.value, bids) });
    revealed = true;
    // Played to the end: the lab is met, its questions open up in practice, and the progress page shows when.
    if (jars.length === JARS) markMet('labs/sealed-bid-auction');
    await tick();
    resultEl?.focus();
  }

  async function showDebrief() {
    debrief = true;
    await tick();
    debriefEl?.focus();
  }
</script>

<div class="lab card">
  <div class="lab-stage">
    <dl class="lab-score">
      <div>
        <dt>Jar</dt>
        <dd data-testid="auction-jar">{jars.length + (item && !revealed ? 1 : 0)} <span class="of">of {JARS}</span></dd>
      </div>
      <div>
        <dt>Your points</dt>
        <dd data-testid="auction-you">{signed(yours)}</dd>
      </div>
      <div>
        <dt>Bots' points</dt>
        <dd>{signed(bots)}</dd>
      </div>
    </dl>
    {#if !item}
      <p>Each jar of coins is worth the same to every bidder, somewhere from {LOW} to {HIGH} points. Nobody knows exactly how much.</p>
      <p>
        You and four bots each get an estimate, within {SPREAD} points of the true value either way. Everyone makes one sealed bid. The highest bid wins and pays
        what it bid, so the winner's profit is the jar's value minus the bid. It can be negative.
      </p>
      <div class="lab-actions">
        <button class="button primary" type="button" onclick={next}>Start with the first jar</button>
      </div>
    {:else if !revealed}
      <p class="estimate">Your estimate: <strong data-testid="auction-estimate">{item.estimates[0]}</strong> points</p>
      <p class="lab-note">The true value is within {SPREAD} points of it, either way. The bots get their own estimates.</p>
      <form class="bid" onsubmit={place}>
        <label for="bid">Your sealed bid, in points</label>
        <div class="lab-actions">
          <input id="bid" type="number" inputmode="numeric" min="0" max="400" step="1" required bind:value={bid} bind:this={inputEl} />
          <button class="button primary" type="submit">Place bid</button>
        </div>
      </form>
    {:else if last}
      <p class="lab-status" tabindex="-1" bind:this={resultEl} aria-live="polite" data-testid="auction-result">
        The jar held {last.value} points. {NAMES[last.winner]} won with a bid of {last.bids[last.winner]}, for {signed(last.profit)} points.
      </p>
      <div class="lab-scroll">
        <table class="lab-table">
          <thead><tr><th>Bidder</th><th class="num">Estimate</th><th class="num">Error</th><th class="num">Bid</th><th>Result</th></tr></thead>
          <tbody>
            {#each NAMES as who, i (who)}
              <tr class:you={i === 0}>
                <td>{who}</td>
                <td class="num">{last.estimates[i]}</td>
                <td class="num">{signed(last.estimates[i]! - last.value)}</td>
                <td class="num">{last.bids[i]}</td>
                <td>{i === last.winner ? `Won, ${signed(last.profit)}` : ''}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <div class="lab-actions">
        {#if jars.length < JARS}
          <button class="button primary" type="button" onclick={next}>Next jar</button>
        {:else}
          <button class="button primary" type="button" onclick={showDebrief} disabled={debrief}>See the debrief</button>
        {/if}
      </div>
    {/if}
  </div>
</div>

{#if debrief}
  <section class="lab-debrief" data-testid="auction-debrief">
    <h2 tabindex="-1" bind:this={debriefEl}>Debrief</h2>
    <div class="lab-scroll">
      <table class="lab-table">
        <thead>
          <tr><th>Jar</th><th class="num">Value</th><th>Winner</th><th class="num">Winner's error</th><th class="num">Profit</th><th>Highest estimate?</th></tr>
        </thead>
        <tbody>
          {#each jars as j, i (i)}
            <tr>
              <td>{i + 1}</td>
              <td class="num">{j.value}</td>
              <td class:you={j.winner === 0}>{NAMES[j.winner]}</td>
              <td class="num">{signed(j.estimates[j.winner]! - j.value)}</td>
              <td class="num">{signed(j.profit)}</td>
              <td>{optimist(j) ? 'Yes' : 'No'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p>
      The winner held the highest estimate in {cursed} of {JARS} jars. You made {signed(yours)} points; the bots, bidding only {BOT_SHADE} under their estimates,
      made {signed(bots)} between them. On average you bid {Math.round(shade)} points below your own estimate.
    </p>
    <h3>What it shows</h3>
    <ul class="lab-lesson">
      <li>
        Everyone guesses the same unknown value, so the highest bid usually comes from the biggest overestimate. Winning is good news about the jar and bad news
        about your estimate.
      </li>
      <li>
        With {BIDDERS} bidders and errors of up to {SPREAD} points, the highest estimate is about {Math.round(breakEvenShade(BIDDERS))} points too high on average.
        Shade your bid by about that much just to break even when you win. With 10 bidders it would be about {Math.round(breakEvenShade(10))}.
      </li>
      <li>
        The more bidders and the rougher the estimates, the more you must shade just to break even. Real bidders often do the opposite, bidding harder when the
        competition is fierce.
      </li>
      <li>
        When the value is personal to you, such as a house you love for your own reasons, there is no curse from winning: set your limit from what it is worth
        to you, and keep to it.
      </li>
    </ul>
  </section>
{/if}

<style>
  .lab-stage {
    min-height: 24rem;
  }
  .of {
    font-size: 0.9rem;
    font-weight: 400;
    color: var(--ink-2);
  }
  .estimate {
    font-size: 1.3rem;
    margin: 0;
  }
  .bid label {
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
  .you {
    font-weight: 700;
  }
</style>
