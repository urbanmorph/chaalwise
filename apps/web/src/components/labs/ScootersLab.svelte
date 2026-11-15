<script lang="ts">
  import { markMet } from '../../lib/meet';
  import { tick } from 'svelte';
  import { shuffle } from '../../lib/labs/seeded';
  import {
    AVERAGE,
    bestPriceAlone,
    CHECK,
    DAYS,
    drawMarket,
    expectedGain,
    goodShare,
    NAMES,
    PARTS,
    PRICES,
    QUALITY,
    screenedGain,
    SELLERS,
    shop,
    warrantyDay,
    WARRANTY_PRICE,
    willSell,
    type PartId,
    type Quality,
    type Stall,
  } from '../../lib/labs/scooters';

  /** Used scooters: nine days buying from sellers who know each scooter's quality: price alone, then a mechanic's check, then warranties. */
  interface Day {
    part: PartId;
    /** What you did, in a few words. */
    did: string;
    bought?: Quality;
    gain: number;
  }

  let days = $state<Day[]>([]);
  let started = $state(false);
  /** Showing the result of the day just played. */
  let done = $state(false);
  let market = $state<Quality[]>([]);
  let names = $state<string[]>([]);
  let checked = $state(false);
  let stalls = $state<Stall[]>([]);
  let status = $state('');
  let debrief = $state(false);
  let headEl = $state<HTMLElement>();
  let statusEl = $state<HTMLElement>();
  let debriefEl = $state<HTMLElement>();

  const partAt = (i: number) => {
    let start = 0;
    for (const p of PARTS) {
      if (i < start + p.days) return { ...p, first: i === start };
      start += p.days;
    }
    return { ...PARTS.at(-1)!, first: false };
  };
  const day = $derived(done ? days.length - 1 : days.length);
  const part = $derived(partAt(day));
  const points = $derived(days.reduce((s, d) => s + d.gain, 0));
  const good = $derived(days.filter((d) => d.bought === 'good').length);
  const signed = (x: number) => (x > 0 ? `+${x}` : `${x}`);
  const worth = (q: Quality) => `a ${q} one, worth ${QUALITY[q].worth} to you`;

  async function focus(el: () => HTMLElement | undefined) {
    await tick();
    el()?.focus();
  }

  function setUp() {
    [done, checked] = [false, false];
    market = drawMarket(Math.random);
    names = shuffle(NAMES, Math.random);
    if (partAt(days.length).id === 'warranty') stalls = warrantyDay(Math.random);
    status = '';
    focus(() => headEl);
  }

  function start() {
    started = true;
    setUp();
  }

  function record(d: Day, text: string) {
    days.push(d);
    done = true;
    status = text;
    // Played to the end: the lab is met, its questions open up in practice, and the progress page shows when.
    if (days.length === DAYS) markMet('labs/used-scooters');
    focus(() => statusEl);
  }

  /** Price alone: one price for any scooter at the market; you buy from a seller who will take it. */
  function offerAll(price: number) {
    const r = shop(market, price, Math.random);
    const goods = market.filter((q) => q === 'good').length;
    const owners = `${goods} of the ${SELLERS} sellers had good scooters`;
    const them = goods === 0 ? '' : willSell('good', price) ? ', and they would sell too' : `, and none of them would sell at ${price}`;
    if (!r.bought) return record({ part: 'price', did: `Offered ${price}`, gain: 0 }, `No seller would take ${price}. ${owners}${them}.`);
    record(
      { part: 'price', did: `Offered ${price}`, bought: r.bought, gain: r.gain },
      `${r.came} of the ${SELLERS} sellers would sell at ${price}. You bought ${names[r.seller!]}'s scooter: ${worth(r.bought)}. ${signed(r.gain)} points. ${owners}${them}.`,
    );
  }

  function check() {
    checked = true;
    status = `The mechanic says ${names[0]}'s scooter is ${market[0]}. That cost you ${CHECK} points.`;
    focus(() => statusEl);
  }

  /** A mechanic's check: one seller, one scooter; check it or not, then name a price. */
  function offerOne(price: number) {
    const q = market[0]!;
    const fee = checked ? CHECK : 0;
    const did = `${checked ? 'Checked, offered' : 'Offered'} ${price}`;
    if (!willSell(q, price))
      return record(
        { part: 'check', did: `${did}; the seller said no`, gain: -fee },
        `${names[0]} says no: ${price} is too little for a ${q} scooter. ${signed(-fee)} points.`,
      );
    const gain = QUALITY[q].worth - price - fee;
    record({ part: 'check', did, bought: q, gain }, `${names[0]} sells. It is ${worth(q)}. ${signed(gain)} points${fee ? `, after the check` : ''}.`);
  }

  function pass() {
    const fee = checked ? CHECK : 0;
    const what = part.id === 'check' ? `${names[0]}'s scooter was ${market[0]}` : '';
    record(
      { part: part.id, did: checked ? 'Checked, bought nothing' : 'Bought nothing', gain: -fee },
      `You buy nothing today. ${what ? `${what}. ` : ''}${signed(-fee)} points.`,
    );
  }

  /** Warranties: two sellers; one may offer a warranty. */
  function buyStall(i: number) {
    const s = stalls[i]!;
    const gain = QUALITY[s.quality].worth - s.price;
    record(
      { part: 'warranty', did: `Bought ${s.warranty ? 'with' : 'without'} a warranty, ${s.price}`, bought: s.quality, gain },
      `You bought ${names[i]}'s scooter: ${worth(s.quality)}. ${signed(gain)} points.`,
    );
  }

  function showDebrief() {
    debrief = true;
    focus(() => debriefEl);
  }
</script>

<div class="lab card">
  <div class="lab-stage">
    <dl class="lab-score">
      <div>
        <dt>Day</dt>
        <dd data-testid="sc-day">{started ? day + 1 : 1} <span class="of">of {DAYS}</span></dd>
      </div>
      <div>
        <dt>Your points</dt>
        <dd data-testid="sc-you">{points}</dd>
      </div>
      <div>
        <dt>Good scooters</dt>
        <dd data-testid="sc-good">{good}</dd>
      </div>
    </dl>
    {#if !started}
      <p>
        You need a scooter, and you buy used ones at a market. A good scooter is worth {QUALITY.good.worth} points to you, a poor one {QUALITY.poor.worth}. Half
        the scooters for sale are good, so an average one is worth {AVERAGE}. The sellers know which they have. You cannot tell by looking.
      </p>
      <p>
        Each day you may buy one scooter. Your points are what it is worth to you, less what you paid. A seller sells only if your price is at least what the
        scooter is worth to them. Nine days, in three parts: price alone, then a mechanic's check, then warranties.
      </p>
      <div class="lab-actions">
        <button class="button primary" type="button" onclick={start}>Start the first day</button>
      </div>
    {:else}
      <h2 class="against" tabindex="-1" bind:this={headEl} data-testid="sc-head">
        {part.name} <span class="lab-note">Day {day + 1} of {DAYS}</span>
      </h2>
      {#if part.id === 'price'}
        <p>{SELLERS} sellers are at the market today. Name one price for any scooter; you buy from a seller who will take it.</p>
      {:else if part.id === 'check'}
        <p>
          {part.first ? 'New: a mechanic can check a scooter before you buy, for ' + CHECK + ' points. ' : ''}One seller, {names[0]}, shows you a scooter today.
          Check it or not, then name your price.
        </p>
      {:else}
        <p>
          {part.first ? 'New: some sellers offer a 3-month warranty: if the scooter breaks down, the seller pays for the repairs. ' : ''}Two sellers today. Buy
          from one, or neither.
        </p>
      {/if}
      {#if !done}
        {#if part.id === 'warranty'}
          <ul class="stalls">
            {#each stalls as s, i (i)}
              <li>
                <strong>{names[i]}</strong>: {s.price} points,
                {#if s.warranty}with a 3-month warranty.{:else}no warranty. “It runs like new,” {names[i]} says.{/if}
              </li>
            {/each}
          </ul>
          <div class="lab-actions">
            {#each stalls as s, i (i)}
              <button class="button primary" type="button" onclick={() => buyStall(i)}>Buy from {names[i]}, {s.price}</button>
            {/each}
            <button class="button" type="button" onclick={pass}>Buy neither</button>
          </div>
        {:else}
          {#if part.id === 'check' && !checked}
            <div class="lab-actions">
              <button class="button" type="button" onclick={check}>Pay {CHECK} for a mechanic's check</button>
            </div>
          {/if}
          <div class="lab-actions" role="group" aria-label="Your price">
            {#each PRICES as price (price)}
              <button class="button primary" type="button" onclick={() => (part.id === 'price' ? offerAll(price) : offerOne(price))}>Offer {price}</button>
            {/each}
            <button class="button" type="button" onclick={pass}>Buy nothing</button>
          </div>
        {/if}
      {:else}
        <div class="lab-actions">
          {#if days.length < DAYS}
            <button class="button primary" type="button" onclick={setUp}>Next day</button>
          {:else}
            <button class="button primary" type="button" onclick={showDebrief} disabled={debrief}>See the debrief</button>
          {/if}
        </div>
      {/if}
    {/if}
    <p class="lab-status" aria-live="polite" tabindex="-1" bind:this={statusEl} data-testid="sc-status">{status}</p>
  </div>
</div>

{#if debrief}
  <section class="lab-debrief" data-testid="sc-debrief">
    <h2 tabindex="-1" bind:this={debriefEl}>Debrief</h2>
    <div class="lab-scroll">
      <table class="lab-table">
        <thead><tr><th>Day</th><th>Part</th><th>What you did</th><th>Scooter</th><th class="num">Points</th></tr></thead>
        <tbody>
          {#each days as d, i (i)}
            <tr>
              <td>{i + 1}</td>
              <td>{PARTS.find((p) => p.id === d.part)!.name}</td>
              <td>{d.did}</td>
              <td>{d.bought ?? 'none'}</td>
              <td class="num you">{signed(d.gain)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p>You ended with {points} points and {good} good {good === 1 ? 'scooter' : 'scooters'}.</p>

    <h3>What each price brings, when you cannot tell</h3>
    <div class="lab-scroll">
      <table class="lab-table" data-testid="sc-prices">
        <thead><tr><th class="num">Price</th><th>Who sells</th><th class="num">Good among them</th><th class="num">Points a scooter, on average</th></tr></thead
        >
        <tbody>
          {#each PRICES as price (price)}
            <tr>
              <td class="num">{price}</td>
              <td>{willSell('good', price) ? 'Everyone' : 'Only owners of poor scooters'}</td>
              <td class="num">{goodShare(price) * 100}%</td>
              <td class="num">{signed(expectedGain(price))}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <h3>What it shows</h3>
    <ul class="lab-lesson">
      <li>
        At a price near the average, 75, only owners of poor scooters sell, and you lose {-expectedGain(75)} points each time. An average scooter is worth {AVERAGE}
        to you, but a good seller wants at least {QUALITY.good.keep}. So any price that brings good scooters out loses you points on average: {expectedGain(90)} at
        90. The good sellers leave the market, and every sale of a good scooter, which would have helped both sides, is lost. This is adverse selection, the market
        for lemons.
      </li>
      <li>
        Screening: the side that knows less pays to find out. A mechanic's check costs {CHECK}, but then you can pay {WARRANTY_PRICE} for a good scooter and 25 for
        a poor one: {screenedGain()} points a day on average, against {bestPriceAlone()} at best on price alone.
      </li>
      <li>
        Signalling: the side that knows more does something costly to fake. A 3-month warranty costs the seller of a good scooter about {QUALITY.good.repairs} points
        in repairs, and the seller of a poor one about {QUALITY.poor.repairs}. That would leave them {WARRANTY_PRICE - QUALITY.poor.repairs} from a sale at {WARRANTY_PRICE},
        less than the {QUALITY.poor.keep} their scooter is worth to them. So only good sellers offer one, and you can believe it. “It runs like new” costs nothing
        to say, so it tells you nothing: every scooter sold without a warranty was poor.
      </li>
      <li>
        A bet in poker is believed the same way: when it would cost the bettor dearly if it were a bluff. See the lesson <a href="/skills/a-bet-tells-a-story/"
          >A bet tells a story</a
        >
        and the idea <a href="/reference/strategy/costly-signals/">Believe what is costly to fake</a>.
      </li>
    </ul>
  </section>
{/if}

<style>
  .lab-stage {
    min-height: 26rem;
  }
  .lab-stage p {
    margin: 0;
  }
  .stalls {
    margin: 0;
    padding-left: 1.2em;
  }
</style>
