<script lang="ts">
  import { markMet } from '../../lib/meet';
  import { tick } from 'svelte';
  import {
    BOARD_RULE,
    ENDOWMENT,
    FINE_COST,
    FINE_HIT,
    fundShare,
    GROWTH,
    holdBackFines,
    holdBackGain,
    MONTHS,
    NEIGHBOURS,
    neighboursTotal,
    PEOPLE,
    playMonth,
    standings,
    type Month,
    type PartId,
  } from '../../lib/labs/shared-fund';

  /**
   * The shared fund: six months putting points into a housing society's fund with four neighbours, seeing only the
   * total, then six months with everyone's amount on the notice board and fines. Then a debrief.
   */

  type Phase = 'intro' | 'plain' | 'between' | 'board' | 'done';

  let phase = $state<Phase>('intro');
  let months = $state<Record<PartId, Month[]>>({ plain: [], board: [] });
  /** This month on the board, before you choose whom to fine. */
  let pending = $state<Month>();
  let fining = $state<number[]>([]);
  let amount = $state<number>();
  let showing = $state(false);
  let debrief = $state(false);
  let headEl = $state<HTMLElement>();
  let inputEl = $state<HTMLInputElement>();
  let boardEl = $state<HTMLElement>();
  let statusEl = $state<HTMLElement>();
  let debriefEl = $state<HTMLElement>();

  const part = $derived<PartId>(phase === 'board' || phase === 'done' ? 'board' : 'plain');
  const played = $derived(months.plain.length + months.board.length);
  const month = $derived(Math.min(2 * MONTHS, played + (showing ? 0 : 1)));
  const last = $derived(months[part].at(-1));
  const you = $derived(standings([...months.plain, ...months.board])[0]!);
  const names = ['You', ...NEIGHBOURS.map((n) => n.name)];
  const finers = NEIGHBOURS.filter((n) => n.fines);
  const allIn = ENDOWMENT * GROWTH * MONTHS;
  const noneIn = ENDOWMENT * MONTHS;

  /** Points as shown: one decimal at most, and a true minus sign for a loss. */
  const pts = (n: number) => {
    const r = Math.round(n * 10) / 10;
    return r < 0 ? `−${-r}` : `${r}`;
  };
  const sumOf = (xs: number[]) => xs.reduce((s, x) => s + x, 0);
  const finesOn = (m: Month, i: number) => m.fines.filter((f) => f.to === i).length;
  const finesBy = (m: Month, i: number) => m.fines.filter((f) => f.from === i).length;
  const list = (xs: string[]) => (xs.length < 2 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);

  async function focus(el: () => HTMLElement | undefined) {
    await tick();
    el()?.focus();
  }

  function start() {
    [months, pending, fining, amount, showing, debrief, phase] = [{ plain: [], board: [] }, undefined, [], undefined, false, false, 'plain'];
    focus(() => inputEl);
  }

  function submit(event: SubmitEvent) {
    event.preventDefault();
    if (showing || pending || !(typeof amount === 'number' && amount >= 0 && amount <= ENDOWMENT)) return;
    const put = Math.round(amount);
    amount = undefined;
    if (part === 'board') {
      pending = playMonth('board', months.board, put, []);
      fining = [];
      focus(() => boardEl);
      return;
    }
    months.plain.push(playMonth('plain', months.plain, put, []));
    showing = true;
    focus(() => statusEl);
  }

  function postFines(event: SubmitEvent) {
    event.preventDefault();
    if (!pending) return;
    months.board.push(playMonth('board', months.board, pending.put[0]!, [...fining].sort()));
    pending = undefined;
    showing = true;
    // Played to the end: the lab is met, its questions open up in practice, and the progress page shows when.
    if (months.board.length === MONTHS) {
      phase = 'done';
      markMet('labs/shared-fund');
    }
    focus(() => statusEl);
  }

  function next() {
    showing = false;
    if (phase === 'plain' && months.plain.length === MONTHS) {
      phase = 'between';
      focus(() => headEl);
    } else focus(() => inputEl);
  }

  function startBoard() {
    phase = 'board';
    focus(() => inputEl);
  }

  function showDebrief() {
    debrief = true;
    focus(() => debriefEl);
  }

  /** The debrief's numbers, from the months played. */
  const plainTotals = $derived(standings(months.plain));
  const firstPlain = $derived(months.plain[0]);
  const lastPlain = $derived(months.plain.at(-1));
  const firstBoard = $derived(months.board[0]);
  const lastBoard = $derived(months.board.at(-1));
  const top = $derived(Math.max(...plainTotals));
  const finesGiven = $derived(sumOf(months.board.map((m) => finesBy(m, 0))));
  const finesGot = $derived(sumOf(months.board.map((m) => finesOn(m, 0))));
</script>

<div class="lab card">
  <div class="lab-stage">
    {#if phase === 'intro'}
      <p>
        You live in a housing society with four neighbours. Every month each of you has {ENDOWMENT} points and chooses how many to put into the maintenance fund,
        which pays for the lift, the lights and the garden. The fund is doubled, then shared equally among all {PEOPLE} of you, whoever put in. What you do not put
        in, you keep.
      </p>
      <p>
        The lab has two parts of {MONTHS} months each. In the first, only the fund's total is posted. In the second, everyone's amount goes up on the notice board.
      </p>
      <p class="lab-note">Points only; nothing to win or buy. About five minutes.</p>
      <div class="lab-actions">
        <button class="button primary" type="button" onclick={start}>Start</button>
      </div>
    {:else if phase === 'between'}
      <h2 tabindex="-1" bind:this={headEl} data-testid="fund-head">Part 2: the notice board</h2>
      <p class="setting">
        The society meets and agrees a rule: everyone puts in at least {BOARD_RULE} a month. From now on, each member's amount goes up on the notice board, and anyone
        may fine a neighbour. A fine costs the one who gives it {FINE_COST} point and the one fined {FINE_HIT}.
      </p>
      <p class="lab-note">Your neighbours start afresh, as they did in month 1.</p>
      <div class="lab-actions">
        <button class="button primary" type="button" onclick={startBoard}>Start part 2</button>
      </div>
    {:else}
      <dl class="lab-score">
        <div>
          <dt>Month</dt>
          <dd data-testid="fund-month">{month} <span class="of">of {2 * MONTHS}</span></dd>
        </div>
        <div>
          <dt>Your points</dt>
          <dd data-testid="fund-you">{pts(you)}</dd>
        </div>
      </dl>
      <h2 data-testid="fund-head">{part === 'plain' ? 'Only the total posted' : 'The notice board'}</h2>
      <p class="setting">
        {#if part === 'plain'}
          You have {ENDOWMENT} points. The fund is doubled and shared by all {PEOPLE}; you will see only its total.
        {:else}
          You have {ENDOWMENT} points. The rule is at least {BOARD_RULE}; every amount goes on the board, and anyone may fine.
        {/if}
      </p>
      {#if pending}
        <form class="notice" onsubmit={postFines} tabindex="-1" bind:this={boardEl} data-testid="fund-notice">
          <p class="facts">On the board this month:</p>
          <ul>
            {#each pending.put as c, i (i)}
              <li>
                <span>{names[i]} put in <strong>{c}</strong></span>
                {#if i > 0}
                  <label><input type="checkbox" value={i} bind:group={fining} /> Fine {names[i]}</label>
                {/if}
              </li>
            {/each}
          </ul>
          <p class="lab-note">A fine costs you {FINE_COST} point and the one you fine {FINE_HIT}.</p>
          <div class="lab-actions">
            <button class="button primary" type="submit">{fining.length ? 'Post the fines' : 'Fine nobody'}</button>
          </div>
        </form>
      {:else if !showing}
        <form class="amount" onsubmit={submit}>
          <label for="fund-amount">Points you put into the fund (you keep the rest)</label>
          <div class="lab-actions">
            <input
              id="fund-amount"
              class="lab-number"
              type="number"
              inputmode="numeric"
              min="0"
              max={ENDOWMENT}
              step="1"
              required
              bind:value={amount}
              bind:this={inputEl}
            />
            <button class="button primary" type="submit">Put in</button>
          </div>
          <p class="lab-note">From 0 to {ENDOWMENT}.</p>
        </form>
      {:else if last}
        <p class="lab-status" tabindex="-1" bind:this={statusEl} aria-live="polite" data-testid="fund-status">
          The fund got {sumOf(last.put)} points in all. Doubled and shared, that is {pts(fundShare(sumOf(last.put)))} each. You kept {ENDOWMENT -
            last.put[0]!}{#if part === 'board'}{#if finesBy(last, 0)}, paid {finesBy(last, 0) * FINE_COST} for your fines{/if}{#if finesOn(last, 0)}, were fined
              by {list(last.fines.filter((f) => f.to === 0).map((f) => names[f.from]!))} ({finesOn(last, 0) * FINE_HIT} points){/if}{/if}
          and end the month with {pts(last.points[0]!)}.
          {#if part === 'board'}
            {@const fined = NEIGHBOURS.flatMap((n, k) => (finesOn(last, k + 1) ? [n.name] : []))}
            {fined.length ? `Fined this month: ${list(fined)}.` : 'No neighbour was fined.'}
          {/if}
        </p>
        <div class="lab-actions">
          {#if phase !== 'done'}
            <button class="button primary" type="button" onclick={next}>Next month</button>
          {:else}
            <button class="button primary" type="button" onclick={showDebrief} disabled={debrief}>See the debrief</button>
            <button class="button" type="button" onclick={start}>Play again</button>
          {/if}
        </div>
      {/if}
    {/if}
  </div>
</div>

{#if debrief && firstPlain && lastPlain && firstBoard && lastBoard}
  <section class="lab-debrief" data-testid="fund-debrief">
    <h2 tabindex="-1" bind:this={debriefEl}>Debrief</h2>
    {#each [{ id: 'plain', title: 'Part 1: only the total posted' }, { id: 'board', title: 'Part 2: the notice board' }] as const as p (p.id)}
      <h3>{p.title}</h3>
      <div class="lab-scroll">
        <table class="lab-table" data-testid={`fund-${p.id}`}>
          <thead>
            <tr>
              <th>Month</th>
              {#each names as n (n)}<th class="num">{n}</th>{/each}
              <th class="num">Neighbours in all</th>
            </tr>
          </thead>
          <tbody>
            {#each months[p.id] as m, i (i)}
              <tr>
                <td>{i + 1}</td>
                {#each m.put as c, j (j)}<td class="num" class:you={j === 0}
                    >{c}{#if finesOn(m, j)}<span class="fined"> fined</span>{/if}</td
                  >{/each}
                <td class="num">{neighboursTotal(m)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      {#if p.id === 'plain'}
        <p data-testid="fund-fall">
          Your neighbours put in {neighboursTotal(firstPlain)} points in month 1 and {neighboursTotal(lastPlain)} in month {MONTHS}. {NEIGHBOURS[0]!.name} put in
          nothing and ended the part with {pts(plainTotals[1]!)} points{plainTotals[1]! > plainTotals.filter((_, i) => i !== 1).reduce((a, b) => Math.max(a, b))
            ? ', more than anyone else'
            : ', as many as anyone'}. You ended with {pts(plainTotals[0]!)}{plainTotals[0]! < top ? '' : ', as many as anyone'}.
        </p>
      {:else}
        <p data-testid="fund-hold">
          With every amount on the board, your neighbours put in {neighboursTotal(firstBoard)} in month 1 and {neighboursTotal(lastBoard)} in month {MONTHS}.
          You gave {finesGiven}
          {finesGiven === 1 ? 'fine' : 'fines'}, which cost you {finesGiven * FINE_COST}, and got {finesGot}, which cost you {finesGot * FINE_HIT}. You ended
          the part with
          {pts(standings(months.board)[0]!)} points.
        </p>
      {/if}
    {/each}
    <h3>Your neighbours' habits</h3>
    <ul class="lab-lesson">
      {#each NEIGHBOURS as n (n.id)}
        <li>
          <strong>{n.name}</strong>
          {n.habit}{n.fines ? ` On the board, ${n.name} fines anyone under ${BOARD_RULE}.` : ''}
        </li>
      {/each}
    </ul>
    <h3>What it shows</h3>
    <ul class="lab-lesson">
      <li>
        Each of you gains by holding back. A point you put in is doubled and shared by {PEOPLE}, so only {pts(fundShare(1))} of it comes back to you. Yet if all {PEOPLE}
        put in everything, each ends {MONTHS} months with {allIn} points; if nobody does, with {noneIn}. It is the trap of the tragedy of the commons, where
        each takes too much from a shared field.
      </li>
      <li>
        Many people give if others do, but a little less. When nobody can see who holds back, one free rider pulls the average down, the others follow, and what
        goes in falls month by month.
      </li>
      <li>
        On the board, putting in 0 instead of {BOARD_RULE} keeps {pts(holdBackGain())} more points, after what the {BOARD_RULE} would have brought back. But {list(
          finers.map((n) => n.name),
        )} each fine it, which costs {holdBackFines()}. Fining costs the one who fines, yet people do it, and what goes in holds up.
      </li>
      <li>
        What keeps shared things going: a record everyone can see, giving back to those who give, and rules the group makes and enforces itself, with small
        fines first. A group chat's shared bills, a common area or a group project works the same way.
      </li>
    </ul>
  </section>
{/if}

<style>
  .lab-stage {
    min-height: 26rem;
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
  .notice {
    display: grid;
    gap: 10px;
  }
  .notice:focus {
    outline: none;
  }
  .notice ul {
    display: grid;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .notice li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 4px 16px;
    min-height: 44px;
    border-bottom: 1px solid var(--rule);
  }
  .notice label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
  }
  .notice input {
    width: 1.2em;
    height: 1.2em;
  }
  .fined {
    margin-left: 0.3em;
    color: var(--fail);
    font-size: 0.85rem;
  }
</style>
