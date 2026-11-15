<script lang="ts">
  import { markMet } from '../../lib/meet';
  import { tick } from 'svelte';
  import {
    CHAIR_MEETINGS,
    condorcetWinner,
    firstPair,
    GROUPS,
    LABEL,
    lookAhead,
    majorities,
    MEMBER_MEETINGS,
    NAME,
    OPTIONS,
    place,
    runAgenda,
    sincere,
    YOUR_GROUP,
    type Option,
    type Vote,
  } from '../../lib/labs/agenda';

  /**
   * Who sets the agenda? Chair a college fest committee for three meetings and
   * choose the order of its votes, then speak for one group in two meetings
   * that bot chairs run. Then a debrief.
   */

  type Phase = 'intro' | 'chair' | 'member' | 'done';
  interface Member {
    first?: Option;
    last?: Option;
  }

  let phase = $state<Phase>('intro');
  /** The option held back in each meeting you chaired. */
  let chaired = $state<Option[]>([]);
  let member = $state<Member[]>([]);
  let showing = $state(false);
  let debrief = $state(false);
  let headEl = $state<HTMLElement>();
  let statusEl = $state<HTMLElement>();
  let debriefEl = $state<HTMLElement>();

  const ROUNDS = CHAIR_MEETINGS.length + MEMBER_MEETINGS.length;
  const chairAt = $derived(showing ? chaired.length - 1 : chaired.length);
  const meeting = $derived(CHAIR_MEETINGS[chairAt]);
  const memberAt = $derived(member.length - 1);
  const bot = $derived(MEMBER_MEETINGS[memberAt]);
  const mine = $derived(member.at(-1));
  const round = $derived(phase === 'chair' ? chairAt + 1 : CHAIR_MEETINGS.length + memberAt + 1);
  /** The best result your group could get in a member meeting. */
  const best = (held: Option) => {
    const { sincere: s, better } = lookAhead(held);
    return (better ?? s).winner;
  };
  const onTarget = $derived(
    chaired.filter((held, i) => runAgenda(held).winner === CHAIR_MEETINGS[i]!.wants).length +
      member.filter((m, i) => m.last && runAgenda(MEMBER_MEETINGS[i]!.held, m).winner === best(MEMBER_MEETINGS[i]!.held)).length,
  );

  const ORDINAL = ['', 'first', 'second', 'last'];
  const SHORT: Record<Option, string> = { band: 'Band', comedy: 'Comedy', dance: 'Dance' };
  const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);
  /** An order of votes, in words. */
  const orderText = (held: Option) => {
    const [x, y] = firstPair(held);
    return `${LABEL[x]} against ${NAME[y]} first, then the winner against ${NAME[held]}`;
  };
  const voteText = (v: Vote) => `${v.pair.map((o) => `${LABEL[o]} ${v.count[o]}`).join(', ')}: ${LABEL[v.winner]} wins.`;

  async function focus(el: () => HTMLElement | undefined) {
    await tick();
    el()?.focus();
  }

  function start() {
    [chaired, member, showing, debrief, phase] = [[], [], false, false, 'chair'];
    focus(() => headEl);
  }

  function setOrder(held: Option) {
    chaired.push(held);
    showing = true;
    focus(() => statusEl);
  }

  function next() {
    showing = false;
    if (phase === 'chair' && chaired.length < CHAIR_MEETINGS.length) return focus(() => headEl);
    phase = 'member';
    member.push({});
    focus(() => headEl);
  }

  function vote(o: Option) {
    const m = member.at(-1)!;
    if (!m.first) m.first = o;
    else {
      m.last = o;
      // Played to the end: the lab is met, its questions open up in practice, and the progress page shows when.
      if (member.length === MEMBER_MEETINGS.length) {
        phase = 'done';
        markMet('labs/who-sets-the-agenda');
      }
    }
    focus(() => statusEl);
  }

  function showDebrief() {
    debrief = true;
    focus(() => debriefEl);
  }
</script>

{#snippet rankings()}
  <p class="lab-note">The committee: three groups of four, each voting together.</p>
  <div class="lab-scroll">
    <table class="lab-table ranks">
      <thead><tr><th>Group</th><th>1st choice</th><th>2nd</th><th>3rd</th></tr></thead>
      <tbody>
        {#each GROUPS as g (g.id)}
          <tr class={phase !== 'chair' && g.id === YOUR_GROUP ? 'you' : ''}>
            <td>{cap(g.name.replace(/^The /, ''))}{phase !== 'chair' && g.id === YOUR_GROUP ? ' (you)' : ''}</td>
            {#each g.ranking as o (o)}<td>{SHORT[o]}</td>{/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/snippet}

<div class="lab card">
  <div class="lab-stage">
    {#if phase === 'intro'}
      <p>
        A college fest committee must choose its main event: {NAME.band}, {NAME.comedy} or {NAME.dance}. It has three groups of four members, and each group
        votes together. {GROUPS.map((g) => `${g.name} ${g.about}`).join(' ')}
      </p>
      <p>
        The committee votes on two options first, then puts the winner against the third. In the first part you chair three meetings and choose that order. In
        the second, a bot chairs, and you speak for the day scholars’ four votes.
      </p>
      <p class="lab-note">No points to win or buy. A few minutes in all.</p>
      <div class="lab-actions">
        <button class="button primary" type="button" onclick={start}>Start</button>
      </div>
    {:else}
      <dl class="lab-score">
        <div>
          <dt>Meeting</dt>
          <dd data-testid="ag-round">{round} <span class="of">of {ROUNDS}</span></dd>
        </div>
        <div>
          <dt>Got what you aimed for</dt>
          <dd data-testid="ag-score">{onTarget}</dd>
        </div>
      </dl>
      {@render rankings()}
      {#if phase === 'chair' && meeting}
        <h2 tabindex="-1" bind:this={headEl} data-testid="ag-head">You chair meeting {chairAt + 1}</h2>
        <p class="setting">{meeting.who} asks you for {NAME[meeting.wants]}, because {meeting.why}. Everyone votes for the option their group likes more.</p>
        {#if !showing}
          <fieldset class="step">
            <legend>Choose the order of the votes</legend>
            <div class="lab-actions column">
              {#each OPTIONS as held (held)}
                <button class="button" type="button" onclick={() => setOrder(held)}>{orderText(held)}</button>
              {/each}
            </div>
          </fieldset>
        {:else}
          {@const run = runAgenda(chaired.at(-1)!)}
          <ol class="votes">
            {#each run.votes as v, i (i)}<li>{voteText(v)}</li>{/each}
          </ol>
          <p class="lab-status" tabindex="-1" bind:this={statusEl} aria-live="polite" data-testid="ag-status">
            The committee chose {NAME[run.winner]}. {run.winner === meeting.wants
              ? `You got what ${meeting.who.toLowerCase()} asked for.`
              : `Not what ${meeting.who.toLowerCase()} asked for.`}
          </p>
          <div class="lab-actions">
            <button class="button primary" type="button" onclick={next}>
              {chaired.length < CHAIR_MEETINGS.length ? 'Next meeting' : 'Now a bot chairs'}
            </button>
          </div>
        {/if}
      {:else if bot && mine}
        {@const run = runAgenda(bot.held, mine)}
        <h2 tabindex="-1" bind:this={headEl} data-testid="ag-head">{bot.chair} chairs meeting {round}</h2>
        <p class="setting">
          {bot.chair}, {bot.who} who wants {NAME[bot.favourite]}, sets the order: {orderText(bot.held)}. You speak for the day scholars’ four votes; the other
          groups vote for the option they like more.
        </p>
        {#if mine.first}
          <ol class="votes">
            <li>{voteText(run.votes[0]!)}</li>
            {#if mine.last}<li>{voteText(run.votes[1]!)}</li>{/if}
          </ol>
        {/if}
        {#if !mine.last}
          {@const pair = mine.first ? run.votes[1]!.pair : firstPair(bot.held)}
          <fieldset class="step">
            <legend>{mine.first ? 'The last vote' : 'The first vote'}: your group’s four votes go to</legend>
            <div class="lab-actions">
              {#each pair as o (o)}
                <button class="button" type="button" onclick={() => vote(o)}>{LABEL[o]}</button>
              {/each}
            </div>
          </fieldset>
        {/if}
        <p class="lab-status" tabindex="-1" bind:this={statusEl} aria-live="polite" data-testid="ag-status">
          {#if mine.last}
            The committee chose {NAME[run.winner]}, your group’s {ORDINAL[place(run.winner)]} choice.
          {:else if mine.first}
            Now {NAME[run.votes[0]!.winner]} faces {NAME[bot.held]}.
          {/if}
        </p>
        {#if mine.last}
          <div class="lab-actions">
            {#if phase !== 'done'}
              <button class="button primary" type="button" onclick={next}>Next meeting</button>
            {:else}
              <button class="button primary" type="button" onclick={showDebrief} disabled={debrief}>See the debrief</button>
              <button class="button" type="button" onclick={start}>Play again</button>
            {/if}
          </div>
        {/if}
      {/if}
    {/if}
  </div>
</div>

{#if debrief}
  {@const [m1, m2] = MEMBER_MEETINGS.map((m) => lookAhead(m.held))}
  <section class="lab-debrief" data-testid="ag-debrief">
    <h2 tabindex="-1" bind:this={debriefEl}>Debrief</h2>
    <h3>The majorities go round in a circle</h3>
    <ul class="lab-lesson" data-testid="ag-cycle">
      {#each majorities() as m (m.winner)}
        <li>{cap(NAME[m.winner])} beats {NAME[m.loser]}, {m.votes} votes to {m.against}.</li>
      {/each}
    </ul>
    {#if !condorcetWinner()}
      <p>So no option beats both of the others, and whichever is held back to the last vote wins.</p>
    {/if}
    <h3>As chair</h3>
    <div class="lab-scroll">
      <table class="lab-table">
        <thead><tr><th>Meeting</th><th>Asked for</th><th>Held back to the last vote</th><th>Chosen</th></tr></thead>
        <tbody>
          {#each CHAIR_MEETINGS as m, i (m.who)}
            <tr>
              <td>{i + 1}</td>
              <td>{LABEL[m.wants]}</td>
              <td>{LABEL[chaired[i]!]}</td>
              <td class="you">{LABEL[runAgenda(chaired[i]!).winner]}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <h3>As a member</h3>
    <div class="lab-scroll">
      <table class="lab-table">
        <thead><tr><th>Meeting</th><th>Your first vote</th><th>Chosen</th><th>Best you could get</th></tr></thead>
        <tbody>
          {#each MEMBER_MEETINGS as m, i (m.chair)}
            {@const first = member[i]!.first!}
            <tr>
              <td>{CHAIR_MEETINGS.length + i + 1}</td>
              <td>{LABEL[first]} ({first === sincere(firstPair(m.held)) ? 'sincere' : 'strategic'})</td>
              <td class="you">{LABEL[runAgenda(m.held, member[i]).winner]}</td>
              <td>{LABEL[best(m.held)]}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p data-testid="ag-summary">
      In meeting {CHAIR_MEETINGS.length + 1}, a sincere first vote for {NAME[m1!.sincere.first]} led to {NAME[m1!.sincere.winner]}, your group’s {ORDINAL[
        place(m1!.sincere.winner)
      ]} choice.
      {#if m1!.better}
        A strategic first vote for {NAME[m1!.better.first]} led to {NAME[m1!.better.winner]}, your {ORDINAL[place(m1!.better.winner)]}.
      {/if}
      In meeting {CHAIR_MEETINGS.length + 2}, a sincere vote led to {NAME[m2!.sincere.winner]}, and {m2!.better
        ? `a strategic one to ${NAME[m2!.better.winner]}`
        : 'no other vote did better, so a sincere vote was already your best'}.
    </p>
    <h3>What it shows</h3>
    <ul class="lab-lesson">
      <li>
        A group’s majorities can go round in a circle, even when each member’s own ranking makes sense. Then there is no option “the group wants”, only the one
        the order of the votes produces.
      </li>
      <li>
        Whoever sets the order, or draws up the shortlist, holds power: as chair, you could get any of the three. Leave one option off a shortlist of two and
        the vote is decided before it starts.
      </li>
      <li>Before you vote, check how the choice was framed: who set the order and the shortlist, and what would win in another order.</li>
      <li>
        Look ahead to the last vote. A strategic vote for your second choice pays when a sincere one leads to your last choice, as in meeting {CHAIR_MEETINGS.length +
          1}. When no vote of yours changes the result, or in the last vote itself, vote sincerely.
      </li>
    </ul>
  </section>
{/if}

<style>
  .lab-stage {
    min-height: 36rem;
  }
  h2 {
    margin: 0;
  }
  .setting {
    margin: 0;
  }
  .ranks :is(th, td) {
    padding: 6px 8px;
  }
  .votes {
    margin: 0;
    padding-left: 1.4em;
    font-variant-numeric: tabular-nums;
  }
  .column {
    flex-direction: column;
    align-items: flex-start;
  }
</style>
