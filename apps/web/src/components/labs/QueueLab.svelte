<script lang="ts">
  import { markMet } from '../../lib/meet';
  import { tick } from 'svelte';
  import { labHref, theLab } from '../../lib/labs/lab-ref';
  import {
    AHEAD,
    BOTH_WRONG,
    debriefSimulation,
    DOOR_NAME,
    drawStreet,
    FRIENDS,
    ROUNDS,
    runStreet,
    SIMULATED,
    STREET,
    tally,
    walk,
    type Door,
    type Run,
    type Street,
  } from '../../lib/labs/cascade';

  /** Follow the queue?: six streets with two restaurants; a friend's tip, the queue ahead, and, later, why they chose. */
  interface Played {
    street: Street;
    run: Run;
  }

  const WIN = 10;
  const PANEL = { slug: 'ask-the-panel', title: 'Ask the panel' };
  const PART_NAME = { queue: 'Read the queue', ask: 'Ask why' };

  let played = $state.raw<Played[]>([]);
  let street = $state.raw<Street>();
  let asked = $state(false);
  let friends = $state(false);
  let debrief = $state(false);
  let headEl = $state<HTMLElement>();
  let statusEl = $state<HTMLElement>();
  let debriefEl = $state<HTMLElement>();

  const done = $derived(played.length > 0 && played.at(-1)!.street === street);
  const index = $derived(done ? played.length - 1 : played.length);
  const round = $derived(ROUNDS[index]!);
  const ahead = $derived(street ? walk(street.tips.slice(0, AHEAD)).people : []);
  const yourTip = $derived(street?.tips[AHEAD]);
  const last = $derived(played.at(-1));
  const right = $derived(played.filter((p) => p.run.people[AHEAD]!.choice === p.street.better).length);
  const SHORT: Record<Door, string> = { blue: 'Blue', green: 'Green' };
  /** Doors counted, such as "4 Blue, 1 Green", leaving out a door no one named. */
  const counts = (doors: Door[]) =>
    (['blue', 'green'] as Door[])
      .map((d) => [doors.filter((x) => x === d).length, SHORT[d]] as const)
      .filter(([n]) => n > 0)
      .map(([n, name]) => `${n} ${name}`)
      .join(', ');
  const ahead5 = (p: Played) => p.run.people.slice(0, AHEAD);
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const sum = $derived(debrief ? tally(played) : undefined);
  const sim = $derived(debrief ? debriefSimulation() : undefined);

  async function focus(el: () => HTMLElement | undefined) {
    await tick();
    el()?.focus();
  }

  function setUp() {
    street = drawStreet(Math.random, ROUNDS[played.length]!.rigged);
    [asked, friends] = [false, false];
    focus(() => headEl);
  }

  function choose(door: Door) {
    if (!street) return;
    played = [...played, { street, run: runStreet(street, door) }];
    // Played to the end: the lab is met, its questions open up in practice, and the progress page shows when.
    if (played.length === ROUNDS.length) markMet('labs/follow-the-queue');
    focus(() => statusEl);
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
        <dt>Street</dt>
        <dd data-testid="fq-street">{index + 1} <span class="of">of {ROUNDS.length}</span></dd>
      </div>
      <div>
        <dt>Your points</dt>
        <dd data-testid="fq-you">{right * WIN}</dd>
      </div>
      <div>
        <dt>Better picks</dt>
        <dd>{right}</dd>
      </div>
    </dl>
    {#if !street}
      <p>
        Two new restaurants have opened side by side: {DOOR_NAME.blue} and {DOOR_NAME.green}. One is better, and you cannot tell which by looking. {STREET} people
        come along the street, one at a time. Each has a tip from a friend about which is better. A tip is right 2 times in 3. Each person also sees where the people
        ahead of them went, then picks one.
      </p>
      <p>
        You are sixth in line. Pick the better restaurant and you get {WIN} points. Six streets: on the first three you read the queue. On the last three you may
        also ask the people ahead why they chose, and ask {FRIENDS} friends who have not seen the queue.
      </p>
      <div class="lab-actions">
        <button class="button primary" type="button" onclick={setUp}>Go to the first street</button>
      </div>
    {:else}
      <h2 class="against" tabindex="-1" bind:this={headEl} data-testid="fq-head">
        {PART_NAME[round.part]} <span class="lab-note">Street {index + 1} of {ROUNDS.length}</span>
      </h2>
      {#if !done}
        <ol class="queue" data-testid="fq-queue">
          {#each ahead as p, i (i)}
            <li>
              Went to <strong>{DOOR_NAME[p.choice]}</strong>{#if asked}.
                <span class="why">“{p.showed ? `My friend’s tip said ${DOOR_NAME[p.tip]}.` : `The queue for ${DOOR_NAME[p.choice]} was longer.`}”</span>{/if}
            </li>
          {/each}
        </ol>
        <p>Your friend’s tip: <strong data-testid="fq-tip">{DOOR_NAME[yourTip!]}</strong>.</p>
        {#if friends}
          <p data-testid="fq-friends">Your {FRIENDS} friends who have not seen the queue say: {street.friends.map((f) => DOOR_NAME[f]).join(', ')}.</p>
        {/if}
        {#if round.part === 'ask' && !(asked && friends)}
          <div class="lab-actions">
            {#if !asked}<button class="button" type="button" onclick={() => (asked = true)}>Ask the queue why</button>{/if}
            {#if !friends}<button class="button" type="button" onclick={() => (friends = true)}>Ask {FRIENDS} friends</button>{/if}
          </div>
        {/if}
        <div class="lab-actions" role="group" aria-label="Your choice">
          <button class="button primary" type="button" onclick={() => choose('blue')}>Go to {DOOR_NAME.blue}</button>
          <button class="button primary" type="button" onclick={() => choose('green')}>Go to {DOOR_NAME.green}</button>
        </div>
      {:else if last}
        <div class="lab-scroll">
          <table class="lab-table" data-testid="fq-reveal">
            <thead><tr><th>In line</th><th>Tip</th><th>Went to</th><th>Why</th></tr></thead>
            <tbody>
              {#each last.run.people as p, i (i)}
                <tr class:you={p.you}>
                  <td>{p.you ? 'You' : i + 1}</td>
                  <td>{DOOR_NAME[p.tip]}</td>
                  <td>{DOOR_NAME[p.choice]}</td>
                  <td>{p.you ? 'Your choice' : p.showed ? 'Their tip' : 'The queue'}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        <p class="lab-note">
          {last.run.lockedAt === undefined
            ? 'The queue never locked: no door led by two tips, so everyone could follow their own tip.'
            : `From person ${last.run.lockedAt + 1}, the queue was locked on ${DOOR_NAME[last.run.door!]}: one door led by two tips, so everyone went there whatever their tip said.`}
          {last.street.rigged
            ? `This street was picked to start wrong: the first two tips were wrong, and yours was right. In a fair draw, the first two tips are both wrong 1 time in ${Math.round(1 / BOTH_WRONG)}.`
            : ''}
        </p>
      {/if}
      <p class="lab-status" tabindex="-1" bind:this={statusEl} aria-live="polite" data-testid="fq-status">
        {#if done && last}
          {@const yours = last.run.people[AHEAD]!.choice}
          {DOOR_NAME[last.street.better]} was better. You went to {DOOR_NAME[yours]}: {yours === last.street.better ? `+${WIN} points.` : 'no points.'}
          {last.street.tips.filter((t) => t === last.street.better).length} of the {STREET} tips pointed to it, and {last.run.people.filter(
            (p) => p.choice === last.street.better,
          ).length} of the {STREET} people went there.
        {/if}
      </p>
      {#if done}
        <div class="lab-actions">
          {#if played.length < ROUNDS.length}
            <button class="button primary" type="button" onclick={setUp}>Next street</button>
          {:else}
            <button class="button primary" type="button" onclick={showDebrief} disabled={debrief}>See the debrief</button>
          {/if}
        </div>
      {/if}
    {/if}
  </div>
</div>

{#if debrief && sum && sim}
  <section class="lab-debrief" data-testid="fq-debrief">
    <h2 tabindex="-1" bind:this={debriefEl}>Debrief</h2>
    <div class="lab-scroll">
      <table class="lab-table">
        <thead>
          <tr><th>Street</th><th>The queue</th><th>Tips it showed</th><th>Your tip</th><th>You</th><th>Better</th></tr>
        </thead>
        <tbody>
          {#each played as p, i (i)}
            <tr>
              <td>{i + 1}{p.street.rigged ? ' (picked)' : ''}</td>
              <td>{counts(ahead5(p).map((q) => q.choice))}</td>
              <td>{counts(ahead5(p).flatMap((q) => (q.showed ? [q.tip] : [])))}</td>
              <td>{SHORT[p.street.tips[AHEAD]!]}</td>
              <td class="you">{SHORT[p.run.people[AHEAD]!.choice]}</td>
              <td>{SHORT[p.street.better]}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p>
      You chose the better restaurant on {right} of {ROUNDS.length} streets. “The queue” is where the five people ahead of you went. “Tips it showed” counts only
      those who chose before the queue locked: only their choices said anything about their tips.
    </p>
    <p data-testid="fq-tally">
      On your six streets, {sum.tipsRight} of the {sum.people} other people had a tip for the better restaurant, and {sum.choseRight} went there. The queue locked
      before you chose on {sum.locked} of the six streets, and on {sum.lockedWrong} of those it locked on the worse one.
    </p>

    <h3>Over {SIMULATED.toLocaleString('en-IN')} fair streets</h3>
    <div class="lab-scroll">
      <table class="lab-table" data-testid="fq-sim">
        <thead><tr><th>Who chooses, and how</th><th class="num">Picks the worse one</th></tr></thead>
        <tbody>
          <tr><td>One person with only a tip</td><td class="num">{pct(sim.oneTip)}</td></tr>
          <tr><td>The last person on a street where everyone reads the queue</td><td class="num">{pct(sim.ended)}</td></tr>
          <tr><td>All {STREET} tips pooled, the majority going</td><td class="num">{pct(sim.pooled)}</td></tr>
          <tr><td>You, sixth, reading the queue</td><td class="num">{pct(sim.youRead)}</td></tr>
          <tr><td>You, sixth, counting the tips the queue showed, plus yours and {FRIENDS} friends’</td><td class="num">{pct(sim.youAsk)}</td></tr>
        </tbody>
      </table>
    </div>
    <p>By the time the sixth person arrives, the queue has locked on one door on {pct(sim.lockedBefore)} of streets.</p>

    <h3>What it shows</h3>
    <ul class="lab-lesson">
      <li>
        Once one door leads by two tips, your own tip cannot outweigh the queue, so following it is sensible. But then your choice shows nothing of your tip,
        and the same goes for everyone after you. The queue grows, but no more information goes into it. This is an information cascade.
      </li>
      <li>
        So a long queue can rest on the first two or three people. A queue does better than one tip alone, but it ends on the worse door far more often than all
        the tips would if they were pooled: {pct(sim.ended)} against {pct(sim.pooled)}.
      </li>
      <li>
        The fix: weigh your own evidence, and count tips, not people. Ask why people chose: “the queue was longer” adds nothing. Prefer opinions given before
        people saw what others chose, as in <a href={labHref(PANEL)}>{theLab(PANEL)}</a>.
      </li>
      <li>
        Off the street: a popular course, a supplier everyone has signed off, an app with many downloads. Ask a few people why they chose, and count only the
        reasons of their own.
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
  .queue {
    margin: 0;
    padding-left: 1.6em;
  }
  .queue li {
    margin-bottom: 4px;
  }
  .why {
    color: var(--ink-2);
  }
  tr.you td {
    font-weight: 700;
  }
</style>
