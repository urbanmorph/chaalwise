<script lang="ts">
  import { markMet } from '../../lib/meet';
  import { tick } from 'svelte';
  import {
    bestDeal,
    BOTS,
    botTurn,
    describe,
    ISSUES,
    MIDDLE,
    NO_DEAL,
    points,
    ROUNDS,
    TOP,
    TRADES,
    YOU,
    YOUR_OFFERS,
    type BotId,
    type Levels,
    type Offer,
  } from '../../lib/labs/trade';

  /** Trade what matters less: two job-offer talks over four issues, against bots with hidden scoring sheets, then a debrief. */
  interface Talk {
    bot: BotId;
    offers: Offer[];
    asked: boolean;
    /** The deal agreed, if any. */
    deal?: Levels;
  }

  let played = $state<Talk[]>([]);
  let current = $state<Talk>();
  let over = $state(false);
  let draft = $state<Levels>({ ...MIDDLE });
  let status = $state('');
  let debrief = $state(false);
  let headEl = $state<HTMLElement>();
  let statusEl = $state<HTMLElement>();
  let debriefEl = $state<HTMLElement>();

  const scoreOf = (t: Talk) => (t.deal ? points(t.bot, t.deal) : NO_DEAL);
  const yours = $derived(played.reduce((s, t) => s + scoreOf(t).you, 0));
  const lastBot = $derived(current?.offers.findLast((o) => o.by === 'bot'));
  const made = $derived(current ? current.offers.filter((o) => o.by === 'you').length : 0);
  const left = $derived(YOUR_OFFERS - made);
  const draftPoints = $derived(points(current?.bot ?? 'meera', draft).you);
  const n = $derived(played.length + (current && !over ? 1 : 0));
  const name = (bot: BotId) => BOTS[bot].name;
  const worth = (id: (typeof ISSUES)[number]['id'], level: number) => (YOU[id] * level) / TOP;

  async function focus(el: () => HTMLElement | undefined) {
    await tick();
    el()?.focus();
  }

  function start() {
    const bot = ROUNDS[played.length]!;
    const talk: Talk = { bot, offers: [], asked: false };
    const opening = botTurn(bot, []);
    if (opening.kind === 'counter') talk.offers.push({ by: 'bot', levels: opening.levels });
    [current, over, draft] = [talk, false, { ...talk.offers[0]!.levels }];
    status = `${name(bot)} opens: ${describe(talk.offers[0]!.levels)}. That gives you ${points(bot, talk.offers[0]!.levels).you} points.`;
    focus(() => headEl);
  }

  function ask() {
    if (!current || current.asked) return;
    current.asked = true;
    status = BOTS[current.bot].answer;
    focus(() => statusEl);
  }

  function finish(deal: Levels | undefined, opening: string) {
    const t = current!;
    t.deal = deal;
    played.push(t);
    over = true;
    // Played to the end: the lab is met, its questions open up in practice, and the progress page shows when.
    if (played.length === ROUNDS.length) markMet('labs/trade-what-matters-less');
    const s = scoreOf(t);
    status = deal
      ? `${opening} Deal: ${s.you} points to you, ${s.them} to ${name(t.bot)}, ${s.you + s.them} in all.`
      : `${opening} No deal: you stay where you are, with ${NO_DEAL.you} points, and ${name(t.bot)} gets ${NO_DEAL.them}.`;
    focus(() => statusEl);
  }

  function offer(event: SubmitEvent) {
    event.preventDefault();
    if (!current || over || left === 0) return;
    const levels = { ...draft };
    current.offers.push({ by: 'you', levels });
    const move = botTurn(current.bot, current.offers);
    const who = name(current.bot);
    if (move.kind === 'accept') return finish(levels, `${who} accepts your offer.`);
    if (move.kind === 'reject') return finish(undefined, `${who} turns down your last offer.`);
    current.offers.push({ by: 'bot', levels: move.levels });
    draft = { ...move.levels };
    const last = left === 1 ? ` Your next offer is your last: ${who} will answer it with yes or no.` : '';
    status = `${who} counters: ${describe(move.levels)}. That gives you ${points(current.bot, move.levels).you} points.${last}`;
    focus(() => statusEl);
  }

  const accept = () => lastBot && finish({ ...lastBot.levels }, 'You accept.');
  const walk = () => finish(undefined, 'You walk away.');

  function showDebrief() {
    debrief = true;
    focus(() => debriefEl);
  }
</script>

<div class="lab card">
  <div class="lab-stage">
    <dl class="lab-score">
      <div>
        <dt>Talk</dt>
        <dd data-testid="tr-talk">{n} <span class="of">of {ROUNDS.length}</span></dd>
      </div>
      <div>
        <dt>Your points</dt>
        <dd data-testid="tr-you">{yours}</dd>
      </div>
    </dl>
    {#if !current}
      <p>
        You have a job offer to settle, twice: first with Meera, then with Rajan. Each offer covers four issues at once: salary, joining date, days a week
        working from home, and a training budget. Each option on each issue is worth points to you, and you can see your own scoring sheet. Each firm has its
        own sheet, and you cannot see it.
      </p>
      <p>
        The firm opens. You can make up to {YOUR_OFFERS} offers; after each, the firm accepts or counters, and it answers your last offer with yes or no. You can
        accept its offer or walk away at any time. With no deal, you stay where you are, worth {NO_DEAL.you} points. You may ask once what matters to the firm.
      </p>
      <div class="lab-actions">
        <button class="button primary" type="button" onclick={start}>Start the first talk</button>
      </div>
    {:else}
      {@const bot = BOTS[current.bot]}
      <h2 class="against" tabindex="-1" bind:this={headEl}>With {bot.name} <span class="lab-note">{bot.about}</span></h2>
      <table class="lab-table sheet">
        <caption class="sr-only">Your scoring sheet: points for each issue when you get your way in full</caption>
        <thead><tr><th>Your sheet</th><th class="num">Points at best</th></tr></thead>
        <tbody>
          {#each ISSUES as i (i.id)}<tr><td>{i.name}</td><td class="num">{YOU[i.id]}</td></tr>{/each}
        </tbody>
      </table>
      <p class="lab-note">Each option is worth a share of that: the middle option half, the one at the firm's end nothing.</p>
      <ol class="offers" aria-label="Offers so far">
        {#each current.offers as o, i (i)}
          <li class:you={o.by === 'you'}>
            <strong>{o.by === 'you' ? 'You' : bot.name}:</strong>
            {describe(o.levels)}. <span class="pts">{points(current.bot, o.levels).you} points to you.</span>
          </li>
        {/each}
      </ol>
      {#if !over}
        <p class="lab-note">{left} {left === 1 ? 'offer' : 'offers'} left for you in this talk.</p>
        {#if left > 0}
          <form class="offer" onsubmit={offer}>
            <fieldset>
              <legend>Your offer</legend>
              <div class="issues">
                {#each ISSUES as i (i.id)}
                  <div>
                    <label for="tr-{i.id}">{i.name}</label>
                    <select id="tr-{i.id}" bind:value={draft[i.id]}>
                      {#each i.levels as text, level (level)}
                        <option value={level}>{text} ({worth(i.id, level)})</option>
                      {/each}
                    </select>
                  </div>
                {/each}
              </div>
            </fieldset>
            <div class="lab-actions">
              <button class="button primary" type="submit">Offer this: {draftPoints} points to you</button>
            </div>
          </form>
        {/if}
        <div class="lab-actions">
          {#if !current.asked}
            <button class="button" type="button" onclick={ask}>Ask what matters most to {bot.name}</button>
          {/if}
          {#if lastBot}
            <button class="button" type="button" onclick={accept}>Accept {bot.name}'s offer: {points(current.bot, lastBot.levels).you} points</button>
          {/if}
          <button class="button" type="button" onclick={walk}>Walk away: {NO_DEAL.you} points</button>
        </div>
      {:else}
        <div class="lab-actions">
          {#if played.length < ROUNDS.length}
            <button class="button primary" type="button" onclick={start}>Next talk</button>
          {:else}
            <button class="button primary" type="button" onclick={showDebrief} disabled={debrief}>See the debrief</button>
          {/if}
        </div>
      {/if}
    {/if}
    <p class="lab-status" aria-live="polite" tabindex="-1" bind:this={statusEl} data-testid="tr-status">{status}</p>
  </div>
</div>

{#if debrief}
  <section class="lab-debrief" data-testid="tr-debrief">
    <h2 tabindex="-1" bind:this={debriefEl}>Debrief</h2>
    <div class="lab-scroll">
      <table class="lab-table">
        <thead>
          <tr><th>Talk</th><th>Asked?</th><th class="num">You</th><th class="num">Firm</th><th class="num">In all</th><th class="num">Best in all</th></tr>
        </thead>
        <tbody>
          {#each played as t, i (i)}
            {@const s = scoreOf(t)}
            <tr>
              <td>{name(t.bot)}{t.deal ? '' : ', no deal'}</td>
              <td>{t.asked ? 'Yes' : 'No'}</td>
              <td class="num you">{s.you}</td>
              <td class="num">{s.them}</td>
              <td class="num">{s.you + s.them}</td>
              <td class="num">{bestDeal(t.bot).total}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="lab-note">Splitting every issue down the middle gives each side 50, so 100 in all. With no deal, each side gets {NO_DEAL.you}.</p>

    <h3>Their hidden sheets</h3>
    <div class="lab-scroll">
      <table class="lab-table" data-testid="tr-sheets">
        <thead>
          <tr
            ><th>Issue</th><th class="num">To you</th>{#each ROUNDS as b (b)}<th class="num">To {name(b)}</th>{/each}</tr
          >
        </thead>
        <tbody>
          {#each ISSUES as i (i.id)}
            <tr>
              <td>{i.name}</td>
              <td class="num">{YOU[i.id]}</td>
              {#each ROUNDS as b (b)}<td class="num">{BOTS[b].sheet[i.id]}</td>{/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="lab-note">Points to each side when it gets its way on the issue in full.</p>

    <h3>What it shows</h3>
    <ul class="lab-lesson">
      <li>
        Splitting each issue down the middle leaves points on the table. The middle gives 100 in all; the best deal would have given {bestDeal('meera').total} with
        Meera and
        {bestDeal('rajan').total} with Rajan, by giving each issue to the side it is worth more to.
      </li>
      {#each ROUNDS as b (b)}
        {@const p = points(b, TRADES[b])}
        <li>
          Trading what matters less makes both better off. With {name(b)}, “{describe(TRADES[b])}” gives you {p.you} points and {name(b)}
          {p.them}: both more than the middle's 50, and {name(b)} accepts it as your second offer.
        </li>
      {/each}
      <li>
        The firms bargained by positions: they met you a step at a time on every issue and never offered a trade. Haggling with them ends in the middle. To find
        a trade, ask about interests, not only positions: Meera needed someone before her project started; Rajan was guarding his team's budget.
      </li>
      <li>Know your walk-away first. A package is worth taking only if it beats what you get with no deal.</li>
    </ul>
  </section>
{/if}

<style>
  .lab-stage {
    min-height: 34rem;
  }
  .sheet {
    max-width: 22rem;
  }
  .offers {
    margin: 0;
    padding-left: 1.4em;
  }
  .offers li {
    margin-bottom: 4px;
  }
  .pts {
    color: var(--ink-2);
  }
  fieldset {
    margin: 0;
    padding: 0;
    border: 0;
  }
  legend {
    font-weight: 600;
    margin-bottom: 6px;
  }
  .issues {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
    gap: 8px 16px;
    margin-bottom: 10px;
  }
  .issues label {
    display: block;
    font-size: 0.85rem;
    color: var(--ink-2);
  }
  select {
    width: 100%;
    min-height: 44px;
    padding: 8px;
    border: 1px solid var(--rule-strong);
    border-radius: var(--radius);
    background: var(--paper);
    color: var(--ink);
    font: inherit;
  }
</style>
