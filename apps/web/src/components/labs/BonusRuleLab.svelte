<script lang="ts">
  import { markMet } from '../../lib/meet';
  import { tick } from 'svelte';
  import {
    DEMAND,
    drawDemand,
    holdRule,
    paidFor,
    playWeek,
    RULES,
    START,
    TEAM_HOURS,
    WEEKS,
    type RuleId,
    type TeamState,
    type Week,
  } from '../../lib/labs/bonus-rule';

  /** The bonus rule: four weeks setting a support team's bonus; the bots do whatever scores best under it. */
  const IDS = Object.keys(RULES) as RuleId[];

  let demand = $state<number[]>([]);
  let weeks = $state<Week[]>([]);
  let team = $state<TeamState>(START);
  let rule = $state<RuleId>();
  /** Showing the result of the week just played. */
  let showing = $state(false);
  let debrief = $state(false);
  let headEl = $state<HTMLElement>();
  let statusEl = $state<HTMLElement>();
  let debriefEl = $state<HTMLElement>();

  const last = $derived(weeks.at(-1));
  const over = $derived(weeks.length === WEEKS);
  const helped = $derived(weeks.reduce((s, w) => s + w.helped, 0));
  const waiting = (s: TeamState) => s.backlog + s.reopened;
  const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

  /** What the bots did in a week, in one sentence. */
  function did(w: Week): string {
    const parts = [
      w.pages && `wrote ${plural(w.pages, 'help page')}`,
      w.fixed && `fixed ${plural(w.fixed, 'problem')} properly`,
      w.rushed && `closed ${plural(w.rushed, 'ticket')} with a quick reply that solved nothing`,
      w.split && `split off ${plural(w.split, 'extra ticket')} to close as well`,
      w.turnedAway && `turned ${plural(w.turnedAway, 'customer')} away before their problem was logged`,
    ].filter(Boolean);
    const list = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : (parts[0] ?? 'did no work that counted');
    return `The bots ${list}.${w.prevented ? ` Help pages headed off ${plural(w.prevented, 'problem')}.` : ''}`;
  }

  const paidText = (w: Week) => (w.rule === 'flat' ? 'nothing extra' : `${paidFor(w)} ${RULES[w.rule].measure}`);

  /** Each rule held for all four weeks, with the same customers, for the debrief. */
  const held = $derived(
    over
      ? IDS.map((id) => {
          const ws = holdRule(id, demand);
          return {
            id,
            paid: ws.reduce((s, w) => s + paidFor(w), 0),
            helped: ws.reduce((s, w) => s + w.helped, 0),
            waiting: waiting(ws.at(-1)!.after),
            turnedAway: ws.reduce((s, w) => s + w.turnedAway, 0),
          };
        })
      : [],
  );
  const best = $derived(held.length ? held.reduce((a, b) => (b.helped > a.helped ? b : a)) : undefined);

  async function focus(el: () => HTMLElement | undefined) {
    await tick();
    el()?.focus();
  }

  function start() {
    [demand, weeks, team, rule, showing, debrief] = [drawDemand(Math.random), [], START, undefined, false, false];
    focus(() => headEl);
  }

  function setRule(event: SubmitEvent) {
    event.preventDefault();
    if (!rule || over) return;
    const played = playWeek(team, rule, demand[weeks.length]!);
    weeks.push(played.week);
    team = played.state;
    showing = true;
    // Played to the end: the lab is met, its questions open up in practice, and the progress page shows when.
    if (weeks.length === WEEKS) markMet('labs/bonus-rule');
    focus(() => statusEl);
  }

  function nextWeek() {
    [rule, showing] = [undefined, false];
    focus(() => headEl);
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
        <dt>Week</dt>
        <dd data-testid="br-week">{showing ? weeks.length : weeks.length + 1} <span class="of">of {WEEKS}</span></dd>
      </div>
      <div>
        <dt>Customers helped</dt>
        <dd data-testid="br-helped">{helped}</dd>
      </div>
      <div>
        <dt>Waiting</dt>
        <dd>{waiting(team)}</dd>
      </div>
    </dl>
    {#if !demand.length}
      <p>
        You run a support desk with four bots, 40 hours a week each. About {DEMAND} customers bring a problem each week. A proper fix takes 4 hours, so the team can
        fix {TEAM_HOURS / 4} a week at most.
      </p>
      <p>
        What you want is customers' problems solved. Each week you choose the bots' bonus rule, and they do whatever earns the most under it. Four weeks; you
        can change the rule each week.
      </p>
      <div class="lab-actions">
        <button class="button primary" type="button" onclick={start}>Start week 1</button>
      </div>
    {:else}
      {#if !showing || !last}
        <form class="rules" onsubmit={setRule}>
          <fieldset>
            <legend tabindex="-1" bind:this={headEl}>
              Week {weeks.length + 1}: choose the bonus rule.
            </legend>
            {#each IDS as id (id)}
              <label><input type="radio" name="rule" value={id} bind:group={rule} />{RULES[id].text}</label>
            {/each}
          </fieldset>
          <div class="lab-actions">
            <button class="button primary" type="submit" disabled={!rule}>Set the rule</button>
          </div>
        </form>
      {:else}
        <p class="lab-status" tabindex="-1" bind:this={statusEl} aria-live="polite" data-testid="br-status">
          Week {weeks.length}, {RULES[last.rule].text.toLowerCase()}. You paid for {paidText(last)}. You wanted problems solved: {last.helped}
          {last.helped === 1 ? 'customer was' : 'customers were'} helped.
        </p>
        <p data-testid="br-did">
          {did(last)}
          {#if last.after.reopened}{plural(last.after.reopened, 'problem')} will come back next week.{/if}
        </p>
        <div class="lab-actions">
          {#if !over}
            <button class="button primary" type="button" onclick={nextWeek}>Week {weeks.length + 1}</button>
          {:else}
            <button class="button primary" type="button" onclick={showDebrief} disabled={debrief}>See the debrief</button>
            <button class="button" type="button" onclick={start}>Play again</button>
          {/if}
        </div>
      {/if}
      {#if weeks.length}
        <div class="lab-scroll">
          <table class="lab-table">
            <caption class="sr-only">Your weeks so far</caption>
            <thead><tr><th>Week</th><th>Rule</th><th>Paid for</th><th class="num">Helped</th><th class="num">Waiting after</th></tr></thead>
            <tbody>
              {#each weeks as w, i (i)}
                <tr>
                  <td>{i + 1}</td>
                  <td>{RULES[w.rule].short}</td>
                  <td>{paidText(w)}</td>
                  <td class="num you">{w.helped}</td>
                  <td class="num">{waiting(w.after)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    {/if}
  </div>
</div>

{#if debrief}
  <section class="lab-debrief" data-testid="br-debrief">
    <h2 tabindex="-1" bind:this={debriefEl}>Debrief</h2>
    <p>
      You helped {helped} customers in four weeks, with {waiting(team)} still waiting. Here is what each rule would have done if you had held it all four weeks, with
      the same customers:
    </p>
    <div class="lab-scroll">
      <table class="lab-table">
        <thead><tr><th>Rule</th><th class="num">Paid for</th><th class="num">Helped</th><th class="num">Waiting</th><th class="num">Turned away</th></tr></thead
        >
        <tbody>
          {#each held as h (h.id)}
            <tr>
              <td class:you={h.id === best?.id}>{RULES[h.id].short}</td>
              <td class="num">{h.id === 'flat' ? '' : `${h.paid} ${RULES[h.id].measure}`}</td>
              <td class="num you">{h.helped}</td>
              <td class="num">{h.waiting}</td>
              <td class="num">{h.turnedAway}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p>
      Paying per ticket closed got the biggest number and helped nobody: a quick reply closes a ticket, and splitting one problem into three closes three.
      Paying for fewer tickets got fewer tickets, by turning customers away. Paying per hour got more hours, spent slowly. Paying for problems solved, and for
      problems a help page heads off, starts slower, because the pages take time, but it pulls ahead once the pages cut the work.
    </p>
    <h3>What it shows</h3>
    <ul class="lab-lesson">
      <li>People do what a rule rewards, not what you hoped for. If the cheapest way to earn the reward is not what you want, you get the cheap way.</li>
      <li>
        When a measure becomes a target, it stops being a good measure. The number you pay on goes up while the goal goes nowhere, and the numbers hide it.
      </li>
      <li>
        Before you set a rule, think one step past it: imagine someone who wants the reward and does not care about the goal. What would they do? Pay for
        something as close to the goal as you can, and watch what the shortcut would harm.
      </li>
      <li>The best rule may look worse in its first week. Judge it over the time it is meant to work.</li>
    </ul>
    <p class="lab-note">
      The bots here are simple and only follow the bonus. Real people also care about their work and their customers, so most game a rule less than these bots
      do; but the pull is the same.
    </p>
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
  fieldset {
    margin: 0 0 12px;
    padding: 0;
    border: 0;
  }
  legend {
    font-weight: 600;
    margin-bottom: 8px;
  }
  legend:focus {
    outline: none;
  }
  .rules label {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 6px 0;
  }
  .rules input {
    margin-top: 0.3em;
  }
</style>
