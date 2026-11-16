<script lang="ts">
  import { markMet } from '../../lib/meet';
  import { tick } from 'svelte';
  import {
    bestKnowing,
    drawStop,
    expectedAgainstBalance,
    pair,
    playPlan,
    points,
    POST,
    QUIT,
    RIVALS,
    STOPS,
    WEEK,
    week,
    type Move,
    type Result,
    type RivalId,
  } from '../../lib/labs/attrition';

  /**
   * Wait them out?: four contests for a housing society's secretary post. Set a stop point, then each week stay in or
   * withdraw against a neighbour with a hidden stop point; then a debrief on stop points, the balance, and signals.
   */

  interface Contest {
    /** Your stop point, set before the first week. */
    plan?: number;
    /** How many weeks the rival stays in, drawn when the lab starts. */
    stop: number;
    moves: Move[];
    result?: Result;
  }

  const fresh = (): Record<RivalId, Contest> =>
    Object.fromEntries(RIVALS.map((r) => [r.id, { stop: drawStop(r.id, Math.random), moves: [] as Move[] }])) as Record<RivalId, Contest>;

  let started = $state(false);
  let at = $state(0);
  let contests = $state(fresh());
  let status = $state('');
  let debrief = $state(false);
  let headEl = $state<HTMLElement>();
  let statusEl = $state<HTMLElement>();
  let debriefEl = $state<HTMLElement>();

  const rival = $derived(RIVALS[at]!);
  const now = $derived(contests[rival.id]);
  const finished = $derived(!!now.result && at === RIVALS.length - 1);
  /** Weeks both stayed in: every week you stayed in, less the one in which they withdrew. */
  const paid = (c: Contest) => (c.result ? c.moves.length - 1 : c.moves.length);
  /** Your points from a contest; until it is settled, only the weeks paid. */
  const scored = (c: Contest) => points(c.result ?? 'lost', paid(c));
  const total = $derived(RIVALS.reduce((s, r) => s + scored(contests[r.id]), 0));
  /** Weeks you chose to stay in. */
  const stayed = (c: Contest) => c.moves.filter((m) => m === 'stay').length;
  const past = (c: Contest) => stayed(c) > c.plan!;

  /** Points as shown: one decimal at most, and a true minus sign for a loss. */
  const pts = (n: number) => {
    const r = Math.round(n * 10) / 10;
    return r === 0 ? '0' : r < 0 ? `−${-r}` : `${r}`;
  };
  const percent = (n: number) => `${Math.round(n * 100)}%`;
  const weeksOf = (n: number) => `${n} week${n === 1 ? '' : 's'}`;
  const planLabel = (n: number) => (n === 0 ? 'Withdraw at once' : weeksOf(n));
  const winner = (c: Contest, name: string) => ({ won: 'You', lost: name, neither: 'Neither' })[c.result!];

  async function focus(el: () => HTMLElement | undefined) {
    await tick();
    el()?.focus();
  }

  function start() {
    [contests, at, status, debrief, started] = [fresh(), 0, '', false, true];
    focus(() => headEl);
  }

  function setPlan(n: number) {
    now.plan = n;
    status = `Your stop point: ${n === 0 ? 'withdraw at once' : `at most ${weeksOf(n)} in`}.`;
    focus(() => statusEl);
  }

  function play(move: Move) {
    if (now.result || now.plan === undefined) return;
    now.moves.push(move);
    const n = now.moves.length;
    const r = week(n, move, now.stop);
    const name = rival.name;
    if (r === 'on') {
      status = `Week ${n}: you both stayed in. Each of you has paid ${pts(n * WEEK)} points.`;
      if (n > now.plan) status += ` You are past your stop point of ${weeksOf(now.plan)}.`;
    } else {
      now.result = r;
      const end = `You paid for ${weeksOf(n - 1)}: ${pts(points(r, n - 1))} points.`;
      status = {
        won: `Week ${n}: ${name} withdrew, and the post is yours. ${end}`,
        lost: `Week ${n}: you withdrew, and ${name} takes the post. ${end}`,
        neither: `Week ${n}: you both withdrew, so the society asks someone else. ${end}`,
      }[r];
      status += ` ${name} would have stayed in for ${weeksOf(now.stop)}.`;
      // Played to the end: the lab is met, its questions open up in practice, and the progress page shows when.
      if (at === RIVALS.length - 1) markMet('labs/wait-them-out');
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

  const wentPast = $derived(RIVALS.filter((r) => past(contests[r.id])));
  const kept = $derived(RIVALS.reduce((s, r) => s + playPlan(contests[r.id].plan!, contests[r.id].stop).points, 0));
</script>

<div class="lab card">
  <div class="lab-stage">
    {#if !started}
      <p>
        You live in a housing society in Pune. The secretary's post is falling vacant, and you and a neighbour both want it. To avoid a vote, the society agrees
        that whoever is left when the other withdraws takes the post. Each week you both stay in, each of you spends evenings visiting flats and asking favours.
      </p>
      <p class="lab-note">
        Points: the post is worth {POST} to whoever gets it. Each week you both stay in costs each of you {WEEK}, whoever gets the post in the end. If you both
        withdraw in the same week, the society asks someone else.
      </p>
      <p>You face four neighbours in turn, a contest each. Before each one, set your stop point. Score as many points as you can.</p>
      <p class="lab-note">Points only; nothing to win or buy. About five minutes.</p>
      <div class="lab-actions">
        <button class="button primary" type="button" onclick={start}>Start</button>
      </div>
    {:else}
      <dl class="lab-score">
        <div>
          <dt>Weeks paid</dt>
          <dd data-testid="wo-weeks">{paid(now)}</dd>
        </div>
        <div>
          <dt>Stop point</dt>
          <dd>{now.plan ?? '–'}</dd>
        </div>
        <div>
          <dt>Your points</dt>
          <dd data-testid="wo-you">{pts(total)}</dd>
        </div>
      </dl>
      <h2 class="against" tabindex="-1" bind:this={headEl} data-testid="wo-head">
        Against {rival.name} <span class="of">({at + 1} of {RIVALS.length})</span>
        <span class="lab-note">{rival.name} {rival.hint}</span>
      </h2>
      {#if now.plan === undefined}
        <fieldset class="step">
          <legend>Before you start: at most how many weeks will you stay in?</legend>
          <div class="lab-actions">
            {#each STOPS as n (n)}
              <button class="button" type="button" onclick={() => setPlan(n)}>{planLabel(n)}</button>
            {/each}
          </div>
        </fieldset>
      {:else}
        <div class="lab-actions">
          {#if !now.result}
            <button class="button primary" type="button" onclick={() => play('stay')}>Stay in</button>
            <button class="button" type="button" onclick={() => play('withdraw')}>Withdraw</button>
          {:else if !finished}
            <button class="button primary" type="button" onclick={nextRival}>Next: {RIVALS[at + 1]!.name}</button>
          {:else}
            <button class="button primary" type="button" onclick={showDebrief} disabled={debrief}>See the debrief</button>
            <button class="button" type="button" onclick={start}>Play again</button>
          {/if}
        </div>
      {/if}
      <p class="lab-status" aria-live="polite" tabindex="-1" bind:this={statusEl} data-testid="wo-status">{status}</p>
    {/if}
  </div>
</div>

{#if debrief}
  <section class="lab-debrief" data-testid="wo-debrief">
    <h2 tabindex="-1" bind:this={debriefEl}>Debrief</h2>
    <h3>Your contests</h3>
    <div class="lab-scroll">
      <table class="lab-table" data-testid="wo-rivals">
        <thead>
          <tr>
            <th>Neighbour</th><th class="num">Your stop point</th><th class="num">Weeks both stayed in</th><th>Post went to</th><th class="num">Your points</th
            ><th class="num">They would stay in</th><th class="num">Best, had you known</th>
          </tr>
        </thead>
        <tbody>
          {#each RIVALS as r (r.id)}
            {@const c = contests[r.id]}
            <tr>
              <td>{r.name}</td>
              <td class="num">{c.plan}</td>
              <td class="num">{paid(c)}</td>
              <td>{winner(c, r.name)}</td>
              <td class="num you">{pts(scored(c))}</td>
              <td class="num">{c.stop}</td>
              <td class="num">{pts(bestKnowing(c.stop))}</td>
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
    <h3>Your stop points</h3>
    <p data-testid="wo-kept">
      You scored {pts(total)}.
      {#if wentPast.length === 0}
        You kept to your stop point in every contest.
      {:else}
        You stayed in past your stop point against {wentPast.map((r) => r.name).join(' and ')}.
      {/if}
      Had you kept to every stop point, you would have scored {pts(kept)}. A stop point is best set before the weeks start to pile up, from what the post is
      worth and what you know of the other side. Once the contest is on, the weeks you have paid are gone whether you stay or withdraw.
    </p>
    <h3>No plan beats {RIVALS[3]!.name}</h3>
    <p>
      {RIVALS[3]!.name} withdraws in any week with a chance of 1 in {Math.round(1 / QUIT)}, whether she has stayed in for one week or for eight. Staying in one
      more week then wins the post's {POST} points 1 time in {Math.round(1 / QUIT)}, about {pts(POST * QUIT)} points on average, and costs {WEEK} point the other
      {Math.round(1 / QUIT) - 1} times, also about {pts(WEEK * (1 - QUIT))}. So against her, every stop point averages the same: 0.
    </p>
    <div class="lab-scroll">
      <table class="lab-table" data-testid="wo-balance">
        <thead><tr><th class="num">Stay in at most</th><th class="num">Your average points</th></tr></thead>
        <tbody>
          {#each STOPS as k (k)}
            <tr><td class="num">{planLabel(k)}</td><td class="num">{pts(expectedAgainstBalance(k))}</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p>
      Her weeks already paid do not make her any more likely to give up next week, and yours do not make the post worth more to you. Each week, the only
      question is whether the next week is worth it.
    </p>
    <h3>When both hold out</h3>
    <p data-testid="wo-pair">
      Say two neighbours both stay in the way {RIVALS[3]!.name} does. Each pays for {pts(pair.weeks)} weeks on average, and one of them gets the post in 20 contests
      of 21. On average each ends with 0: the weeks paid eat the whole post. In {percent(pair.overPost)} of contests, about 1 in 3, the weeks they paid between them
      add up to more than the post is worth, and in {percent(pair.eachOver)}, about 1 in 8, each one alone pays more than it is worth.
    </p>
    <h3>Signals of staying power</h3>
    <p data-testid="wo-signals">
      {RIVALS[1]!.name} told everyone he would never withdraw. Saying so cost him nothing, and he would have stayed in for {weeksOf(contests.arjun.stop)}.
      {RIVALS[2]!.name} paid up front for twenty weeks of notices, which made sense only if she meant to stay, and she would have stayed in for {weeksOf(
        contests.farah.stop,
      )}. Talk is cheap; a signal that costs the one who sends it is believable.
    </p>
    <h3>What it shows</h3>
    <ul class="lab-lesson">
      <li>
        In a war of attrition, both sides pay for every week they hold out, and the one who gives up has paid too. Waiting the other side out pays only against
        those who give up soon.
      </li>
      <li>
        Set your stop point before you start, while you are calm, and keep to it. What you have spent is gone either way: see the lesson <a
          href="/skills/know-when-to-stop/">Know when to stop</a
        >.
      </li>
      <li>
        Against a rival who is as ready to hold out as you, the expected cost of holding out eats the whole prize. Look for a way to settle it without the
        contest: a vote, taking turns, or one post each.
      </li>
      <li>
        Believe signals that cost the sender, not loud words. And when you mean to stay, a step that costs you up front tells the other side to give up early.
        For stand-offs where one side can simply give way, see <a href="/labs/who-backs-down/">the Who backs down? lab</a>.
      </li>
    </ul>
  </section>
{/if}

<style>
  .lab-stage {
    min-height: 22rem;
  }
  .against .of {
    font-weight: 400;
    color: var(--ink-2);
  }
</style>
