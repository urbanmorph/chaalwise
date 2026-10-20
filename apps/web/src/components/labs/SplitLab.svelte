<script lang="ts">
  import { markMet } from '../../lib/meet';
  import { tick } from 'svelte';
  import { botTurn, dealZone, drawRound, MAX_OFFERS, payout, PIE, ROUNDS, STYLES, type Offer, type Round } from '../../lib/labs/split';

  /** Split the pie: five negotiations over 100 points against bots, each side with a walk-away point, then a debrief. */
  interface Played extends Round {
    offers: Offer[];
    /** Points to you in the deal; none if there was no deal. */
    deal?: number;
  }

  let played = $state<Played[]>([]);
  let current = $state<Played>();
  let over = $state(false);
  let ask = $state<number>();
  let status = $state('');
  let debrief = $state(false);
  let inputEl = $state<HTMLInputElement>();
  let acceptEl = $state<HTMLButtonElement>();
  let statusEl = $state<HTMLElement>();
  let debriefEl = $state<HTMLElement>();

  const n = $derived(played.length + (current && !over ? 1 : 0));
  const yours = $derived(played.reduce((s, r) => s + payout(r, r.deal).you, 0));
  const walkAways = $derived(played.reduce((s, r) => s + r.you, 0));
  const lastOffer = $derived(current?.offers.at(-1));
  const botOffer = $derived(lastOffer?.by === 'bot' ? lastOffer : undefined);
  const left = $derived(current ? MAX_OFFERS - current.offers.length : 0);
  const signed = (x: number) => (x > 0 ? `+${x}` : `${x}`);
  const zoneText = (r: Round) => {
    const z = dealZone(r.you, r.bot);
    return z ? `${z.low} to ${z.high}` : 'none';
  };
  const firstAsk = (r: Played) => r.offers.find((o) => o.by === 'you')?.toYou;

  const below = $derived(played.filter((r) => r.deal !== undefined && r.deal < r.you).length);
  const missed = $derived(played.filter((r) => r.deal === undefined && dealZone(r.you, r.bot)).length);

  async function start() {
    const round: Played = { ...drawRound(ROUNDS[played.length]!, Math.random), offers: [] };
    [current, over, ask] = [round, false, undefined];
    const style = STYLES[round.style];
    if (round.opens === 'bot') {
      botMoves();
      status = `${style.name} opens: ${botOffer!.toYou} points to you, ${PIE - botOffer!.toYou} to it.`;
    } else status = `You open. Name the points you want; ${style.name} gets the rest.`;
    await tick();
    inputEl?.focus();
  }

  /** The bot's move after the offers so far; true if the round is still going. */
  function botMoves(): boolean {
    const move = botTurn(current!, current!.offers);
    if (move.kind === 'counter') {
      current!.offers.push({ by: 'bot', toYou: move.toYou });
      return true;
    }
    const name = STYLES[current!.style].name;
    if (move.kind === 'accept') finish(lastOffer!.toYou, `${name} accepts your offer.`);
    else finish(undefined, `${name} turns down your last offer.`);
    return false;
  }

  function finish(deal: number | undefined, opening: string) {
    const r = current!;
    r.deal = deal;
    played.push(r);
    over = true;
    // Played to the end: the lab is met, its questions open up in practice, and the progress page shows when.
    if (played.length === ROUNDS.length) markMet('labs/split-the-pie');
    const got = payout(r, deal);
    const name = STYLES[r.style].name;
    const result =
      deal === undefined
        ? `No deal: you get your walk-away ${r.you} points, and ${name} its ${r.bot}.`
        : `Deal: ${got.you} points to you, ${got.bot} to ${name}. That is ${signed(got.you - r.you)} on your walk-away.`;
    const zone = dealZone(r.you, r.bot);
    const where = zone ? `the deal zone for you was ${zone.low} to ${zone.high}` : 'there was no deal zone';
    status = `${opening} ${result} Its walk-away was ${r.bot}, so ${where}.`;
    tick().then(() => statusEl?.focus());
  }

  async function offer(event: SubmitEvent) {
    event.preventDefault();
    if (!current || over || left === 0) return;
    if (!(typeof ask === 'number' && ask >= 0 && ask <= PIE)) return;
    const toYou = Math.round(ask);
    current.offers.push({ by: 'you', toYou });
    if (!botMoves()) return;
    status = `${STYLES[current.style].name} counters: ${botOffer!.toYou} points to you, ${PIE - botOffer!.toYou} to it.${left === 0 ? ' That is its last offer: accept it or walk away.' : ''}`;
    ask = undefined;
    await tick();
    (left === 0 ? acceptEl : inputEl)?.focus();
  }

  const accept = () => botOffer && finish(botOffer.toYou, 'You accept.');
  const walk = () => finish(undefined, 'You walk away.');

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
        <dt>Round</dt>
        <dd data-testid="split-round">{n} <span class="of">of {ROUNDS.length}</span></dd>
      </div>
      <div>
        <dt>Your points</dt>
        <dd data-testid="split-you">{yours}</dd>
      </div>
      <div>
        <dt>Your walk-aways</dt>
        <dd>{walkAways}</dd>
      </div>
    </dl>
    {#if !current}
      <p>
        Each round you and a bot split {PIE} points. Offers go back and forth, {MAX_OFFERS} at most in all. Either side can accept the other's offer. If there is
        no deal, each side gets its walk-away points instead: what it can get elsewhere.
      </p>
      <p>You always know your own walk-away. In some rounds you also get a rough idea of the bot's.</p>
      <div class="lab-actions">
        <button class="button primary" type="button" onclick={start}>Start the first round</button>
      </div>
    {:else}
      {@const style = STYLES[current.style]}
      <h2 class="against">Against {style.name} <span class="lab-note">{style.about}</span></h2>
      <p class="facts">
        Your walk-away: <strong data-testid="split-walk-away">{current.you}</strong> points.
        {#if current.range}
          The bot's walk-away is somewhere from {current.range[0]} to {current.range[1]}.
        {:else}
          You do not know the bot's walk-away.
        {/if}
      </p>
      <div class="lab-scroll offers">
        <table class="lab-table">
          <caption class="sr-only">Offers so far</caption>
          <thead><tr><th>Offer</th><th>From</th><th class="num">To you</th><th class="num">To the bot</th></tr></thead>
          <tbody>
            {#each current.offers as o, i (i)}
              <tr class:you={o.by === 'you'}>
                <td>{i + 1}</td>
                <td>{o.by === 'you' ? 'You' : style.name}</td>
                <td class="num">{o.toYou}</td>
                <td class="num">{PIE - o.toYou}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      {#if !over}
        <p class="lab-note">{left} {left === 1 ? 'offer' : 'offers'} left in this round.</p>
        {#if left > 0}
          <form class="offer" onsubmit={offer}>
            <label for="split-ask">Your offer: points for you</label>
            <div class="lab-actions">
              <input id="split-ask" type="number" inputmode="numeric" min="0" max={PIE} step="1" required bind:value={ask} bind:this={inputEl} />
              <button class="button primary" type="submit">Offer</button>
            </div>
          </form>
        {/if}
        <div class="lab-actions">
          {#if botOffer}
            <button class="button" class:primary={left === 0} type="button" bind:this={acceptEl} onclick={accept}>Accept {botOffer.toYou}</button>
          {/if}
          <button class="button" type="button" onclick={walk}>Walk away</button>
        </div>
      {:else}
        <div class="lab-actions">
          {#if played.length < ROUNDS.length}
            <button class="button primary" type="button" onclick={start}>Next round</button>
          {:else}
            <button class="button primary" type="button" onclick={showDebrief} disabled={debrief}>See the debrief</button>
          {/if}
        </div>
      {/if}
    {/if}
    <p class="lab-status" aria-live="polite" tabindex="-1" bind:this={statusEl} data-testid="split-status">{status}</p>
  </div>
</div>

{#if debrief}
  <section class="lab-debrief" data-testid="split-debrief">
    <h2 tabindex="-1" bind:this={debriefEl}>Debrief</h2>
    <div class="lab-scroll">
      <table class="lab-table">
        <thead>
          <tr
            ><th>Round</th><th>Bot</th><th class="num">Walk-aways</th><th>Deal zone</th><th class="num">First offer</th><th>Result</th><th class="num">Gain</th
            ></tr
          >
        </thead>
        <tbody>
          {#each played as r, i (i)}
            {@const got = payout(r, r.deal).you}
            <tr>
              <td>{i + 1}</td>
              <td>{STYLES[r.style].name.replace(' bot', '')}</td>
              <td class="num">{r.you} / {r.bot}</td>
              <td>{zoneText(r)}</td>
              <td class="num">{firstAsk(r) ?? ''}</td>
              <td class="you">{r.deal === undefined ? 'No deal' : 'Deal'}, {got}</td>
              <td class="num">{signed(got - r.you)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="lab-note">Walk-aways are yours, then the bot's. The deal zone and the result are points to you; gain is the result less your walk-away.</p>
    <p>
      You ended with {yours} points; walking away every time would have given you {walkAways}. You took {below}
      {below === 1 ? 'deal' : 'deals'} below your walk-away, and left {missed}
      {missed === 1 ? 'round' : 'rounds'} with no deal when a deal zone existed.
    </p>
    <h3>What it shows</h3>
    <ul class="lab-lesson">
      <li>
        The deal zone lies between the two walk-away points. Any deal in it beats no deal for both sides; outside it, no deal is the right result, as in round
        4.
      </li>
      <li>Never accept less than your walk-away. If the offer is worse than what you can get elsewhere, walk away, however long the talks took.</li>
      <li>
        Your walk-away is your best alternative to a deal, your BATNA. Improving it before the talks, with another offer or another buyer, is usually the
        strongest lever you have: the other side must beat it.
      </li>
      <li>
        A confident first offer with reasons behind it tends to pull the result towards it, because the other side counters from there. That works when you know
        what the deal is worth. When you do not, find out first.
      </li>
    </ul>
  </section>
{/if}

<style>
  .lab-stage {
    min-height: 30rem;
  }
  .of {
    font-size: 0.9rem;
    font-weight: 400;
    color: var(--ink-2);
  }
  .against {
    margin: 0;
    font-size: 1.2rem;
  }
  .against .lab-note {
    display: block;
    font-size: 0.95rem;
    font-weight: 400;
  }
  .facts {
    margin: 0;
  }
  .offers {
    min-height: 10.5em;
  }
  .offer label {
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
</style>
