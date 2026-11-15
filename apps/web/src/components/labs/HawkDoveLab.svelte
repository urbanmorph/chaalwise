<script lang="ts">
  import { markMet } from '../../lib/meet';
  import { tick } from 'svelte';
  import {
    BALANCE,
    bestPlan,
    blowUpChance,
    everyWeek,
    expected,
    payoff,
    playRival,
    PRIZE,
    RISK,
    RIVALS,
    WEEKS,
    type Move,
    type RivalId,
  } from '../../lib/labs/hawk-dove';

  /**
   * Who backs down?: five weeks against each of four rival sweet shops, pushing or giving way, then a debrief on the
   * balance, a name for never backing down, and brinkmanship.
   */

  interface Week {
    you: Move;
    them: Move;
  }

  let started = $state(false);
  let at = $state(0);
  let weeks = $state<Record<RivalId, Week[]>>({ meena: [], ramesh: [], gopal: [], salim: [] });
  let status = $state('');
  let debrief = $state(false);
  let headEl = $state<HTMLElement>();
  let statusEl = $state<HTMLElement>();
  let debriefEl = $state<HTMLElement>();

  const rival = $derived(RIVALS[at]!);
  const played = $derived(weeks[rival.id]);
  const over = $derived(played.length === WEEKS);
  const finished = $derived(over && at === RIVALS.length - 1);
  const all = $derived(RIVALS.flatMap((r) => weeks[r.id]));
  const total = $derived(all.reduce((s, w) => s + payoff(w.you, w.them), 0));
  const theirTotal = $derived(played.reduce((s, w) => s + payoff(w.them, w.you), 0));

  /** Points as shown: one decimal at most, and a true minus sign for a loss. */
  const pts = (n: number) => {
    const r = Math.round(n * 10) / 10;
    return r < 0 ? `−${-r}` : `${r}`;
  };
  const percent = (n: number) => `${Math.round(n * 100)}%`;
  const verb = (m: Move) => (m === 'push' ? 'pushed' : 'gave way');
  const NAME: Record<Move, string> = { push: 'Push', give: 'Give way' };

  async function focus(el: () => HTMLElement | undefined) {
    await tick();
    el()?.focus();
  }

  function start() {
    [weeks, at, status, debrief, started] = [{ meena: [], ramesh: [], gopal: [], salim: [] }, 0, '', false, true];
    focus(() => headEl);
  }

  function play(you: Move) {
    if (over) return;
    const yours = played.map((w) => w.you);
    const them = playRival(
      rival.id,
      [...yours, you],
      Math.random,
      played.map((w) => w.them),
    ).them.at(-1)!;
    played.push({ you, them });
    status = `Week ${played.length}: you ${verb(you)}, ${rival.name} ${verb(them)}. You got ${pts(payoff(you, them))}, ${rival.name} ${pts(payoff(them, you))}.`;
    if (played.length === WEEKS) {
      status += ` That was your last week against ${rival.name}.`;
      // Played to the end: the lab is met, its questions open up in practice, and the progress page shows when.
      if (at === RIVALS.length - 1) markMet('labs/who-backs-down');
    }
    focus(() => statusEl);
  }

  function nextRival() {
    at += 1;
    status = '';
    focus(() => headEl);
  }

  function showDebrief() {
    debrief = true;
    focus(() => debriefEl);
  }

  /** The debrief's numbers, from the weeks played: Salim's moves are replayed as they fell. */
  const replay = (id: RivalId, yours: Move[]) => playRival(id, yours, Math.random, id === 'salim' ? weeks.salim.map((w) => w.them) : undefined).points;
  const yourPoints = (id: RivalId) =>
    replay(
      id,
      weeks[id].map((w) => w.you),
    );
  const neverBack = $derived(RIVALS.reduce((s, r) => s + replay(r.id, everyWeek('push')), 0));
  const alwaysGive = $derived(RIVALS.reduce((s, r) => s + replay(r.id, everyWeek('give')), 0));
  const best = (id: RivalId) => (id === 'salim' ? `about ${pts(WEEKS * expected('push', BALANCE))}, either way` : pts(bestPlan(id).points));
  const SHARES = [0, 0.1, 0.25, BALANCE, 0.5];
  const BRINK = [1, 3, 5, 10];
</script>

<div class="lab card">
  <div class="lab-stage">
    {#if !started}
      <p>
        You run a sweet shop in a market lane in Pune. Another sweet shop faces yours. Each week, before the weekend crowd, each of you chooses: push (cut
        prices and fight for every customer) or give way (keep your prices and share the lane). You both choose at the same time.
      </p>
      <p class="lab-note">
        Points a week: both give way, 5 each. One pushes and the other gives way: {PRIZE} to the one who pushed, 0 to the other. Both push: a price war, {pts(
          payoff('push', 'push'),
        )} each.
      </p>
      <p>You face four rivals in turn, five weeks each. Score as many points as you can.</p>
      <p class="lab-note">Points only; nothing to win or buy. About five minutes.</p>
      <div class="lab-actions">
        <button class="button primary" type="button" onclick={start}>Start</button>
      </div>
    {:else}
      <dl class="lab-score">
        <div>
          <dt>Week</dt>
          <dd data-testid="bd-week">{at * WEEKS + played.length} <span class="of">of {RIVALS.length * WEEKS}</span></dd>
        </div>
        <div>
          <dt>Your points</dt>
          <dd data-testid="bd-you">{pts(total)}</dd>
        </div>
        <div>
          <dt>{rival.name}</dt>
          <dd>{pts(theirTotal)}</dd>
        </div>
      </dl>
      <h2 class="against" tabindex="-1" bind:this={headEl} data-testid="bd-head">
        Against {rival.name}
        <span class="lab-note">{rival.name} {rival.hint}</span>
      </h2>
      <div class="lab-actions">
        {#if !over}
          <button class="button primary" type="button" onclick={() => play('push')}>{NAME.push}</button>
          <button class="button" type="button" onclick={() => play('give')}>{NAME.give}</button>
        {:else if !finished}
          <button class="button primary" type="button" onclick={nextRival}>Next: {RIVALS[at + 1]!.name}</button>
        {:else}
          <button class="button primary" type="button" onclick={showDebrief} disabled={debrief}>See the debrief</button>
          <button class="button" type="button" onclick={start}>Play again</button>
        {/if}
      </div>
      <p class="lab-status" aria-live="polite" tabindex="-1" bind:this={statusEl} data-testid="bd-status">{status}</p>
      <div class="lab-scroll">
        <table class="lab-table moves">
          <caption class="sr-only">Weeks so far against {rival.name}: P is push, G is give way</caption>
          <tbody>
            <tr>
              <th scope="row">You</th>
              {#each played as w, i (i)}<td class={w.you === 'give' ? 'tag-c' : 'tag-d'}>{w.you === 'push' ? 'P' : 'G'}</td>{/each}
            </tr>
            <tr>
              <th scope="row">{rival.name}</th>
              {#each played as w, i (i)}<td class={w.them === 'give' ? 'tag-c' : 'tag-d'}>{w.them === 'push' ? 'P' : 'G'}</td>{/each}
            </tr>
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

{#if debrief}
  <section class="lab-debrief" data-testid="bd-debrief">
    <h2 tabindex="-1" bind:this={debriefEl}>Debrief</h2>
    <h3>Your rivals</h3>
    <div class="lab-scroll">
      <table class="lab-table" data-testid="bd-rivals">
        <thead>
          <tr><th>Rival</th><th class="num">You pushed</th><th class="num">Price wars</th><th class="num">Your points</th><th class="num">Best plan</th></tr>
        </thead>
        <tbody>
          {#each RIVALS as r (r.id)}
            <tr>
              <td>{r.name}</td>
              <td class="num">{weeks[r.id].filter((w) => w.you === 'push').length}</td>
              <td class="num">{weeks[r.id].filter((w) => w.you === 'push' && w.them === 'push').length}</td>
              <td class="num you">{pts(yourPoints(r.id))}</td>
              <td class="num">{best(r.id)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <ul class="lab-lesson">
      {#each RIVALS as r (r.id)}
        <li><strong>{r.name}</strong> {r.rule}</li>
      {/each}
    </ul>
    <p data-testid="bd-never">
      You scored {pts(total)}. Never backing down, all {RIVALS.length * WEEKS} weeks, would have scored {pts(neverBack)}: it wins every week against {RIVALS[0]!
        .name} and
      {RIVALS[2]!.name}, but against {RIVALS[1]!.name} it is a price war every week, {pts(WEEKS * payoff('push', 'push'))} in all. Always giving way would have scored
      {pts(alwaysGive)}.
    </p>
    <h3>The balance</h3>
    <p>
      {RIVALS[3]!.name} pushed in {weeks.salim.filter((w) => w.them === 'push').length} of the {WEEKS} weeks. Against a rival who pushes one week in three, pushing
      and giving way both earn {pts(expected('push', BALANCE))} a week on average, so there is no way to beat the mix. If more than one rival in three never backs
      down, giving way pays more; if fewer, pushing does. The table shows a week's points when a share of your rivals never back down and the rest give way to you.
    </p>
    <div class="lab-scroll">
      <table class="lab-table" data-testid="bd-shares">
        <thead><tr><th class="num">Rivals who never back down</th><th class="num">You never back down</th><th class="num">You give way</th></tr></thead>
        <tbody>
          {#each SHARES as s (s)}
            <tr class:you={s === BALANCE}>
              <td class="num">{s === BALANCE ? 'One in three' : percent(s)}</td>
              <td class="num">{pts(expected('push', s))}</td>
              <td class="num">{pts(expected('give', s))}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <h3>Brinkmanship</h3>
    <p>
      Some stand-offs do not end in a week. Each week both sides hold on, there is a risk that things blow up for both: a customer walks out on you both, a boss
      steps in, a family stops speaking. Say the risk is 1 in {Math.round(1 / RISK)} a week. Holding on is then a bet that the other side gives way before the risk
      catches up with you both.
    </p>
    <div class="lab-scroll">
      <table class="lab-table" data-testid="bd-brink">
        <thead><tr><th class="num">Weeks both hold on</th><th class="num">Chance it has blown up</th></tr></thead>
        <tbody>
          {#each BRINK as n (n)}
            <tr><td class="num">{n}</td><td class="num">{percent(blowUpChance(n))}</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
    <h3>What it shows</h3>
    <ul class="lab-lesson">
      <li>
        When a fight costs more than the prize, the best move depends on the other side: push against one who gives way, give way to one who never does. Neither
        always pushing nor always giving way is right.
      </li>
      <li>
        A name for never backing down pays against rivals who give way to it, like {RIVALS[2]!.name}. But it locks you into ruinous fights with anyone who has
        the same name, like {RIVALS[1]!.name}, and it pays less once more than one rival in three shares it.
      </li>
      <li>
        A threat to never back down works only if they believe it. Commitment, such as a step you cannot undo, is how to make it believable: see <a
          href="/labs/who-moves-first/">the Who moves first lab</a
        >.
      </li>
      <li>
        Brinkmanship means letting a shared risk grow until the other side gives way. It works only if they give way first, and the risk falls on you too.
        Before you hold on, ask what the fight would cost you both, and offer a way out that lets the other side give way without losing face.
      </li>
    </ul>
  </section>
{/if}

<style>
  .lab-stage {
    min-height: 22rem;
  }
  .moves {
    width: auto;
    min-height: 4.5em;
  }
  .moves td {
    width: 2em;
    text-align: center;
    font-family: var(--mono);
  }
</style>
