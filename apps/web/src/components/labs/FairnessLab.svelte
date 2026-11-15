<script lang="ts">
  import { markMet } from '../../lib/meet';
  import { tick } from 'svelte';
  import {
    acceptRate,
    accepts,
    averageKept,
    bestOffer,
    CROWD,
    FIRST_SEND,
    GROWTH,
    NEHA,
    nextSend,
    PIE,
    playReturns,
    RECEIVERS,
    RESPONDERS,
    RETURN_ROUNDS,
    SEND_ROUNDS,
    sendResult,
    SHOWN_OFFERS,
    STAKE,
  } from '../../lib/labs/fairness';

  /**
   * Split it fairly?: offer a split of 100 points to four bots who can say no,
   * send points that are tripled to two partners, then send back to one who
   * trusts you as you treat her. Then a debrief.
   */

  type Phase = 'intro' | 'offer' | 'send' | 'return' | 'done';

  let phase = $state<Phase>('intro');
  let offers = $state<number[]>([]);
  let sends = $state<ReturnType<typeof sendResult>[]>([]);
  let returns = $state<{ sent: number; got: number; back: number; kept: number }[]>([]);
  let amount = $state<number>();
  let showing = $state(false);
  let debrief = $state(false);
  let headEl = $state<HTMLElement>();
  let inputEl = $state<HTMLInputElement>();
  let statusEl = $state<HTMLElement>();
  let debriefEl = $state<HTMLElement>();

  const ROUNDS = RESPONDERS.length + SEND_ROUNDS.length + RETURN_ROUNDS;
  const done = $derived(offers.length + sends.length + returns.length);
  const round = $derived(Math.min(ROUNDS, done + (showing ? 0 : 1)));
  /** The index within this part of the round on screen. */
  const at = $derived((phase === 'offer' ? offers.length : phase === 'send' ? sends.length : returns.length) - (showing ? 1 : 0));
  const responder = $derived(RESPONDERS[at]);
  const receiver = $derived(RECEIVERS.find((r) => r.id === SEND_ROUNDS[at]));
  const nehaSends = $derived(returns.length === 0 ? FIRST_SEND : showing ? returns.at(-1)!.sent : nextSend(returns.at(-1)!.sent, returns.at(-1)!.back));
  const kept = (offer: number, limit: number) => (accepts(limit, offer) ? PIE - offer : 0);
  const offerTotal = $derived(offers.reduce((s, o, i) => s + kept(o, RESPONDERS[i]!.limit), 0));
  const sendTotal = $derived(sends.reduce((s, r) => s + r.you, 0));
  const returnTotal = $derived(returns.reduce((s, r) => s + r.kept, 0));
  const total = $derived(offerTotal + sendTotal + returnTotal);
  /** The most you could ask for in the form: the pie, your stake, or what reached you from Neha. */
  const max = $derived(phase === 'offer' ? PIE : phase === 'send' ? STAKE : nehaSends * GROWTH);
  /** What happened before with this partner, if you have met. */
  const before = $derived(phase === 'send' ? sends.findLast((_, i) => SEND_ROUNDS[i] === SEND_ROUNDS[at] && i < at) : undefined);
  const best = bestOffer();
  /** What the one who sends back keeps over the four rounds by always keeping all, and by always sending back half. */
  const keepAll = playReturns(() => 0);
  const keptIn = (rounds: { kept: number }[]) => rounds.reduce((s, r) => s + r.kept, 0);
  const half = keptIn(playReturns((got) => Math.ceil(got / 2)));

  async function focus(el: () => HTMLElement | undefined) {
    await tick();
    el()?.focus();
  }

  function start() {
    [offers, sends, returns, amount, showing, debrief, phase] = [[], [], [], undefined, false, false, 'offer'];
    focus(() => inputEl);
  }

  function submit(event: SubmitEvent) {
    event.preventDefault();
    if (showing || !(typeof amount === 'number' && amount >= 0 && amount <= max)) return;
    const n = Math.round(amount);
    if (phase === 'offer') offers.push(n);
    else if (phase === 'send') sends.push(sendResult(SEND_ROUNDS[at]!, n));
    else {
      const got = nehaSends * GROWTH;
      returns.push({ sent: nehaSends, got, back: n, kept: got - n });
      // Played to the end: the lab is met, its questions open up in practice, and the progress page shows when.
      if (returns.length === RETURN_ROUNDS) {
        phase = 'done';
        markMet('labs/split-it-fairly');
      }
    }
    [showing, amount] = [true, undefined];
    focus(() => statusEl);
  }

  function next() {
    showing = false;
    if (phase === 'offer' && offers.length === RESPONDERS.length) phase = 'send';
    else if (phase === 'send' && sends.length === SEND_ROUNDS.length) phase = 'return';
    focus(() => inputEl);
  }

  function showDebrief() {
    debrief = true;
    focus(() => debriefEl);
  }
</script>

<div class="lab card">
  <div class="lab-stage">
    {#if phase === 'intro'}
      <p>
        This lab has three parts. First, you split {PIE} points with each of four bots. You make one offer; the bot accepts it, or says no, and then neither of you
        gets anything.
      </p>
      <p>
        Then you hold {STAKE} points in each of four rounds and may send some to a partner. Whatever you send is tripled, and the partner decides how much to send
        back. Last, the roles swap: a bot sends to you, and you decide what to send back.
      </p>
      <p class="lab-note">Points only; nothing to win or buy. A few minutes in all.</p>
      <div class="lab-actions">
        <button class="button primary" type="button" onclick={start}>Start</button>
      </div>
    {:else}
      <dl class="lab-score">
        <div>
          <dt>Round</dt>
          <dd data-testid="sf-round">{round} <span class="of">of {ROUNDS}</span></dd>
        </div>
        <div>
          <dt>Your points</dt>
          <dd data-testid="sf-you">{total}</dd>
        </div>
      </dl>
      {#if phase === 'offer' && responder}
        <h2 tabindex="-1" bind:this={headEl} data-testid="sf-head">Split {PIE} points with {responder.name}</h2>
        <p class="setting">{responder.name} {responder.about} If {responder.name} says no, you both get nothing.</p>
      {:else if phase === 'send' && receiver}
        <h2 tabindex="-1" bind:this={headEl} data-testid="sf-head">Trust {receiver.name}?</h2>
        <p class="setting">
          {receiver.name}
          {receiver.about} You hold {STAKE} points. What you send is tripled, then {receiver.name} decides how much to send back.
        </p>
        <p class="lab-note" data-testid="sf-before">
          {#if before}
            Last time you sent {before.sent}; it became {before.got}, and {receiver.name} sent back {before.back}.
          {:else}
            You have not dealt with {receiver.name} before.
          {/if}
        </p>
      {:else}
        <h2 tabindex="-1" bind:this={headEl} data-testid="sf-head">{NEHA.name} trusts you</h2>
        <p class="setting">
          {NEHA.about} This is round {Math.min(returns.length + (showing ? 0 : 1), RETURN_ROUNDS)} of {RETURN_ROUNDS}.
        </p>
        <p class="facts">
          {NEHA.name} sends you {nehaSends} of her {STAKE} points. Tripled, they make <strong data-testid="sf-got">{nehaSends * GROWTH}</strong>.
        </p>
      {/if}
      {#if !showing}
        <form class="amount" onsubmit={submit}>
          <label for="sf-amount">
            {phase === 'offer'
              ? `Points you offer ${responder!.name} (you keep the rest)`
              : phase === 'send'
                ? `Points you send ${receiver!.name}`
                : `Points you send back to ${NEHA.name}`}
          </label>
          <div class="lab-actions">
            <input
              id="sf-amount"
              class="lab-number"
              type="number"
              inputmode="numeric"
              min="0"
              {max}
              step="1"
              required
              bind:value={amount}
              bind:this={inputEl}
            />
            <button class="button primary" type="submit">{phase === 'offer' ? 'Offer' : 'Send'}</button>
          </div>
          <p class="lab-note">From 0 to {max}.</p>
        </form>
      {:else}
        <p class="lab-status" tabindex="-1" bind:this={statusEl} aria-live="polite" data-testid="sf-status">
          {#if phase === 'offer'}
            {@const o = offers.at(-1)!}
            {accepts(responder!.limit, o)
              ? `${responder!.name} accepts: you keep ${PIE - o}, and ${responder!.name} gets ${o}.`
              : `${responder!.name} says no: you both get nothing.`}
          {:else if phase === 'send'}
            {@const r = sends.at(-1)!}
            You sent {r.sent}; it became {r.got}. {receiver!.name} sent back {r.back}, so you end the round with {r.you}.
          {:else}
            {@const r = returns.at(-1)!}
            You sent back {r.back} and kept {r.kept}. {NEHA.name} ends the round with {STAKE - r.sent + r.back}{r.back > r.sent
              ? ', more than she started with'
              : r.back < r.sent
                ? ', less than she started with'
                : ', as she started'}.
          {/if}
        </p>
        <div class="lab-actions">
          {#if phase !== 'done'}
            <button class="button primary" type="button" onclick={next}>Next</button>
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
  <section class="lab-debrief" data-testid="sf-debrief">
    <h2 tabindex="-1" bind:this={debriefEl}>Debrief</h2>
    <h3>Splitting 100 points</h3>
    <div class="lab-scroll">
      <table class="lab-table">
        <thead><tr><th>Bot</th><th class="num">Says no below</th><th class="num">You offered</th><th>Answer</th><th class="num">You kept</th></tr></thead>
        <tbody>
          {#each RESPONDERS as r, i (r.name)}
            <tr>
              <td>{r.name}</td>
              <td class="num">{r.limit}</td>
              <td class="num">{offers[i]}</td>
              <td class={accepts(r.limit, offers[i]!) ? 'tag-c' : 'tag-d'}>{accepts(r.limit, offers[i]!) ? 'Yes' : 'No'}</td>
              <td class="num you">{kept(offers[i]!, r.limit)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p>
      Counting only points, {RESPONDERS[0]!.name} was right: anything is better than nothing, so pure maths says offer 1. But people are not like that. Here are six
      offers, each made to a crowd of {CROWD.length} bots whose limits are set near what studies found: about half say no to offers below 20, and nearly all accept
      40.
    </p>
    <div class="lab-scroll">
      <table class="lab-table" data-testid="sf-crowd">
        <thead><tr><th class="num">Offer</th><th class="num">Accepted by</th><th class="num">You keep on average</th></tr></thead>
        <tbody>
          {#each SHOWN_OFFERS as o (o)}
            <tr class:you={o === best}>
              <td class="num">{o}</td>
              <td class="num">{Math.round(acceptRate(o) * CROWD.length)} of {CROWD.length}</td>
              <td class="num">{Math.round(averageKept(o))}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <h3>Trusting a partner</h3>
    <div class="lab-scroll">
      <table class="lab-table">
        <thead
          ><tr><th>Partner</th><th class="num">Sent</th><th class="num">Became</th><th class="num">Sent back</th><th class="num">You ended with</th></tr></thead
        >
        <tbody>
          {#each sends as r, i (i)}
            <tr>
              <td>{RECEIVERS.find((p) => p.id === SEND_ROUNDS[i])!.name}</td>
              <td class="num">{r.sent}</td>
              <td class="num">{r.got}</td>
              <td class="num">{r.back}</td>
              <td class="num you">{r.you}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p>
      {RECEIVERS[0]!.name} pays trust back: she sends back half of what reaches her, so sending her all {STAKE} leaves you {sendResult('meera', STAKE).you}. {RECEIVERS[1]!
        .name} keeps everything, so with him sending nothing is best: you keep {STAKE}. Together, you and a partner end with {STAKE} plus twice what you send: trust
      grows what there is to share.
    </p>
    <h3>Sending back</h3>
    <div class="lab-scroll">
      <table class="lab-table">
        <thead
          ><tr><th>Round</th><th class="num">{NEHA.name} sent</th><th class="num">Became</th><th class="num">You sent back</th><th class="num">You kept</th></tr
          ></thead
        >
        <tbody>
          {#each returns as r, i (i)}
            <tr>
              <td>{i + 1}</td>
              <td class="num">{r.sent}</td>
              <td class="num">{r.got}</td>
              <td class="num">{r.back}</td>
              <td class="num you">{r.kept}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p data-testid="sf-summary">
      You kept {returnTotal} points as the one who sends back. Keeping everything each time keeps {keptIn(keepAll)}: {NEHA.name} soon sends only {keepAll.at(
        -1,
      )!.sent}. Sending back half each time keeps {half}, because she trusts you with all {STAKE} from then on. In the last round, keeping everything would have paid
      more still, as there was no next time. Only fairness holds a person back then, which is why one-off deals need a contract. In all, you scored {total} points.
    </p>
    <h3>What it shows</h3>
    <ul class="lab-lesson">
      <li>
        People turn down offers they find unfair, even when saying no costs them. Fairness is a real force: the offer that keeps the most is not the smallest
        one but one the other side can accept with pride, here {best} of {PIE}.
      </li>
      <li>Trust grows what there is to share. Each point you send becomes three, so a partner who pays you back leaves you both better off.</li>
      <li>Trust pays only with people who pay it back. Judge by their record, not their words, and with a stranger, trust in small steps.</li>
      <li>
        Be worth trusting. A partner who is treated fairly trusts you with more next time; one who is cheated sends less. This is reciprocity, and your
        reputation is the record people keep of you.
      </li>
    </ul>
  </section>
{/if}

<style>
  .lab-stage {
    min-height: 28rem;
  }
  h2 {
    margin: 0;
  }
  .setting,
  .facts {
    margin: 0;
  }
  .amount label {
    display: block;
    font-weight: 600;
    margin-bottom: 6px;
  }
  .amount .lab-note {
    margin-top: 6px;
  }
  .lab-table tr.you td {
    font-weight: 700;
  }
</style>
