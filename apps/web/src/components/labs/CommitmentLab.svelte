<script lang="ts">
  import { markMet } from '../../lib/meet';
  import { tick } from 'svelte';
  import {
    credible,
    DEFENCES,
    firstMoves,
    OWNERS,
    ownerAnswer,
    readTheTree,
    rivalOpens,
    threatTotal,
    treeAfter,
    type Answer,
    type FirstMove,
    type Tree,
  } from '../../lib/labs/commitment';

  /**
   * Who moves first: three tea-stall owners threaten a price war if you open
   * beside them; then the stall is yours, and you choose a first move before two
   * rivals decide whether to open. Then a debrief.
   */

  type Phase = 'intro' | 'threat' | 'defend' | 'done';
  interface Judged {
    guess: Answer;
    opened: boolean;
    points: number;
  }
  interface Defended {
    move: FirstMove;
    opened: boolean;
    answer?: Answer;
    points?: number;
  }

  let phase = $state<Phase>('intro');
  let judged = $state<Judged[]>([]);
  let defended = $state<Defended[]>([]);
  /** This round's guess at what the owner will do, before you choose. */
  let guess = $state<Answer>();
  let showing = $state(false);
  let debrief = $state(false);
  let headEl = $state<HTMLElement>();
  let statusEl = $state<HTMLElement>();
  let debriefEl = $state<HTMLElement>();

  const ROUNDS = OWNERS.length + DEFENCES.length;
  const owner = $derived(OWNERS[showing && phase === 'threat' ? judged.length - 1 : judged.length]);
  const defIndex = $derived(showing ? defended.length - 1 : defended.length);
  const defence = $derived(DEFENCES[defIndex]);
  const current = $derived(defended.at(-1));
  /** Waiting for your answer after the rival opened. */
  const answering = $derived(phase === 'defend' && !!current && current.opened && current.points === undefined);
  const round = $derived(phase === 'threat' ? (showing ? judged.length : judged.length + 1) : OWNERS.length + defIndex + 1);
  const total = $derived(judged.reduce((s, j) => s + j.points, 0) + defended.reduce((s, d) => s + (d.points ?? 0), 0));
  const best = threatTotal(readTheTree) + DEFENCES.reduce((s, d) => s + Math.max(...Object.values(firstMoves(d))), 0);

  /** Points as shown: a true minus sign for a loss. */
  const pts = (n: number) => (n < 0 ? `−${-n}` : `${n}`);
  const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);
  /** A verb agreeing with its subject: "you open", "Raju opens". */
  const verb = (who: string, base: string) => (who === 'you' ? base : `${base}s`);
  const ANSWER: Record<Answer, string> = { share: 'Share the customers', war: 'Start a price war' };
  const MOVE: Record<FirstMove, string> = { nothing: 'Did nothing', announce: 'Announced a price war', lease: 'Signed the deal' };

  async function focus(el: () => HTMLElement | undefined) {
    await tick();
    el()?.focus();
  }

  function start() {
    [judged, defended, guess, showing, debrief, phase] = [[], [], undefined, false, false, 'threat'];
    focus(() => headEl);
  }

  function choose(opened: boolean) {
    const t = owner!.tree;
    judged.push({ guess: guess!, opened, points: opened ? t[ownerAnswer(t)].newcomer : t.out.newcomer });
    showing = true;
    focus(() => statusEl);
  }

  function next() {
    [showing, guess] = [false, undefined];
    if (phase === 'threat' && judged.length === OWNERS.length) phase = 'defend';
    focus(() => headEl);
  }

  function moveFirst(move: FirstMove) {
    const t = treeAfter(defence!, move);
    const opened = rivalOpens(t);
    defended.push({ move, opened, points: opened ? undefined : t.out.owner });
    showing = true;
    if (!opened) finishRound();
    focus(() => statusEl);
  }

  function respond(answer: Answer) {
    const d = current!;
    [d.answer, d.points] = [answer, treeAfter(defence!, d.move)[answer].owner];
    finishRound();
    focus(() => statusEl);
  }

  function finishRound() {
    // Played to the end: the lab is met, its questions open up in practice, and the progress page shows when.
    if (defended.length === DEFENCES.length) {
      phase = 'done';
      markMet('labs/who-moves-first');
    }
  }

  function showDebrief() {
    debrief = true;
    focus(() => debriefEl);
  }
</script>

<!-- A game tree in plain words: who moves, what they can do, and the points each side ends with. "you" is the learner. -->
{#snippet treeView(t: Tree, newcomer: string, holder: string, title: string)}
  <figure class="tree">
    <figcaption>{title}</figcaption>
    <ul>
      <li>
        {cap(newcomer)}
        {verb(newcomer, 'stay')} out: <span class="pay">{newcomer} {pts(t.out.newcomer)}, {holder} {pts(t.out.owner)}</span>
      </li>
      <li>
        {cap(newcomer)}
        {verb(newcomer, 'open')}, then {holder}
        {verb(holder, 'choose')}:
        <ul>
          <li>{ANSWER.share}: <span class="pay">{newcomer} {pts(t.share.newcomer)}, {holder} {pts(t.share.owner)}</span></li>
          <li>{ANSWER.war}: <span class="pay">{newcomer} {pts(t.war.newcomer)}, {holder} {pts(t.war.owner)}</span></li>
        </ul>
      </li>
    </ul>
  </figure>
{/snippet}

<div class="lab card">
  <div class="lab-stage">
    {#if phase === 'intro'}
      <p>
        This lab has two parts. First, you plan to open a tea stall beside an owner who already has one, and each owner threatens a price war if you do. The
        numbers show what each side ends with, in points, after each choice. Decide whether each threat would really be carried out, then open or stay out.
      </p>
      <p>Then the stall is yours, and a rival plans to open beside you. Before the rival decides, you make the first move.</p>
      <p class="lab-note">Points only; nothing to win or buy. A few minutes in all.</p>
      <div class="lab-actions">
        <button class="button primary" type="button" onclick={start}>Start</button>
      </div>
    {:else}
      <dl class="lab-score">
        <div>
          <dt>Round</dt>
          <dd data-testid="wm-round">{round} <span class="of">of {ROUNDS}</span></dd>
        </div>
        <div>
          <dt>Your points</dt>
          <dd data-testid="wm-you">{pts(total)}</dd>
        </div>
      </dl>
      {#if phase === 'threat' && owner}
        {@const j = showing ? judged.at(-1) : undefined}
        <h2 tabindex="-1" bind:this={headEl} data-testid="wm-head">{owner.name}’s stall</h2>
        <p class="says">{owner.name} says: “{owner.says}”</p>
        <p class="setting">{owner.know}</p>
        {@render treeView(owner.tree, 'you', owner.name, `Beside ${owner.name}: the points each side ends with`)}
        {#if !j}
          <fieldset class="step">
            <legend>If you open, what will {owner.name} really do?</legend>
            <div class="lab-actions">
              {#each ['share', 'war'] as const as a (a)}
                <button class="button" type="button" aria-pressed={guess === a} onclick={() => (guess = a)}>{ANSWER[a]}</button>
              {/each}
            </div>
          </fieldset>
          {#if guess}
            <fieldset class="step">
              <legend>Your move</legend>
              <div class="lab-actions">
                <button class="button primary" type="button" onclick={() => choose(true)}>Open your stall</button>
                <button class="button" type="button" onclick={() => choose(false)}>Stay out</button>
              </div>
            </fieldset>
          {/if}
        {:else}
          {@const t = owner.tree}
          {@const a = ownerAnswer(t)}
          <p class="lab-status" tabindex="-1" bind:this={statusEl} aria-live="polite" data-testid="wm-status">
            {#if j.opened}
              You opened. {owner.name} chose to {a === 'share' ? 'share the customers' : 'start a price war'}: you {pts(t[a].newcomer)}, {owner.name}
              {pts(t[a].owner)}.
            {:else}
              You stayed out: you 0. Had you opened, {owner.name} would have chosen to {a === 'share' ? 'share the customers' : 'start a price war'}, leaving
              you {pts(t[a].newcomer)}.
            {/if}
            {j.guess === a ? 'You guessed right.' : 'You guessed wrong.'}
          </p>
          <p data-testid="wm-why">
            {#if credible(t)}
              The threat was real: a price war pays {owner.name}
              {t.war.owner}, more than the {t.share.owner} from sharing.
            {:else}
              The threat was empty: a price war would leave {owner.name} with {t.war.owner}, less than the {t.share.owner} from sharing.
            {/if}
          </p>
          <div class="lab-actions">
            <button class="button primary" type="button" onclick={next}>{judged.length < OWNERS.length ? 'Next owner' : 'Now the stall is yours'}</button>
          </div>
        {/if}
      {:else if defence}
        {@const rival = defence.rival.name}
        <h2 tabindex="-1" bind:this={headEl} data-testid="wm-head">{rival} plans to open beside you</h2>
        <p class="setting">The stall is yours now. {rival} {defence.rival.about}</p>
        {@render treeView(defence.tree, rival, 'you', 'As things are: the points each side ends with')}
        <p class="setting"><strong>The deal on offer:</strong> {defence.deal}</p>
        {@render treeView(defence.signed, rival, 'you', 'Once the deal is signed')}
        {#if !showing}
          <fieldset class="step">
            <legend>Your first move, before {rival} decides</legend>
            <div class="lab-actions">
              <button class="button" type="button" onclick={() => moveFirst('nothing')}>Do nothing</button>
              <button class="button" type="button" onclick={() => moveFirst('announce')}>Announce a price war if anyone opens</button>
              <button class="button" type="button" onclick={() => moveFirst('lease')}>Sign the deal</button>
            </div>
          </fieldset>
        {:else if current}
          {@const t = treeAfter(defence, current.move)}
          <p class="lab-status" tabindex="-1" bind:this={statusEl} aria-live="polite" data-testid="wm-status">
            {#if !current.opened}
              {rival} stays out: with the deal signed, a price war would pay you more than sharing, so opening would cost {rival} points. You take {t.out
                .owner}.
            {:else if answering}
              {rival} opens beside you. {current.move === 'announce' ? `Your announcement did not change your numbers, so ${rival} did not believe it.` : ''} Now
              you choose.
            {:else}
              {rival} opened. You chose to {current.answer === 'share' ? 'share the customers' : 'start a price war'}: you {pts(current.points!)}, {rival}
              {pts(t[current.answer!].newcomer)}.
            {/if}
          </p>
          {#if answering}
            <div class="lab-actions">
              <button class="button primary" type="button" onclick={() => respond('share')}>{ANSWER.share}</button>
              <button class="button" type="button" onclick={() => respond('war')}>{ANSWER.war}</button>
            </div>
          {:else}
            <div class="lab-actions">
              {#if phase !== 'done'}
                <button class="button primary" type="button" onclick={next}>Next rival</button>
              {:else}
                <button class="button primary" type="button" onclick={showDebrief} disabled={debrief}>See the debrief</button>
                <button class="button" type="button" onclick={start}>Play again</button>
              {/if}
            </div>
          {/if}
        {/if}
      {/if}
    {/if}
  </div>
</div>

{#if debrief}
  {@const moves = DEFENCES.map(firstMoves)}
  <section class="lab-debrief" data-testid="wm-debrief">
    <h2 tabindex="-1" bind:this={debriefEl}>Debrief</h2>
    <h3>Judging a threat</h3>
    <div class="lab-scroll">
      <table class="lab-table">
        <thead><tr><th>Owner</th><th>Threat</th><th>Guess</th><th>You</th><th class="num">Points</th><th class="num">Best</th></tr></thead>
        <tbody>
          {#each OWNERS as o, i (o.id)}
            <tr>
              <td>{o.name}</td>
              <td class={credible(o.tree) ? 'tag-d' : 'tag-c'}>{credible(o.tree) ? 'Real' : 'Empty'}</td>
              <td>{judged[i]!.guess === ownerAnswer(o.tree) ? 'Right' : 'Wrong'}</td>
              <td>{judged[i]!.opened ? 'Opened' : 'Stayed out'}</td>
              <td class="num you">{pts(judged[i]!.points)}</td>
              <td class="num">{pts(readTheTree(o) ? o.tree[ownerAnswer(o.tree)].newcomer : o.tree.out.newcomer)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <h3>Moving first</h3>
    <div class="lab-scroll">
      <table class="lab-table">
        <thead><tr><th>Rival</th><th>Your move</th><th>They</th><th class="num">Points</th><th class="num">Best</th></tr></thead>
        <tbody>
          {#each DEFENCES as d, i (d.rival.name)}
            <tr>
              <td>{d.rival.name}</td>
              <td>{MOVE[defended[i]!.move]}</td>
              <td>{defended[i]!.opened ? 'Opened' : 'Stayed out'}</td>
              <td class="num you">{pts(defended[i]!.points!)}</td>
              <td class="num">{Math.max(...Object.values(moves[i]!))}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p data-testid="wm-summary">
      You scored {pts(total)} points; the most possible was {best}. In the first part, believing every threat and staying out would have scored {threatTotal(
        () => false,
      )}, and ignoring every threat and opening, {threatTotal(() => true)}. Reading each owner’s own numbers scores {threatTotal(readTheTree)}. Against {DEFENCES[0]!
        .rival.name}, the deal paid: {moves[0]!.lease} against {moves[0]!.nothing} from sharing. Against {DEFENCES[1]!.rival.name}, it cost more than it saved: {moves[1]!
        .lease} against {moves[1]!.nothing}. Announcing a price war changed nothing: a rival who thinks ahead opens anyway.
    </p>
    <h3>What it shows</h3>
    <ul class="lab-lesson">
      <li>
        A threat is believable only if carrying it out pays the one who made it, when the time comes. Raju and Sunil said the same as Meena, but a price war
        would cost them more than sharing, so they shared.
      </li>
      <li>
        Words cost nothing, and a deal that can be cancelled for free is only words. Sunil’s deal changed none of his numbers, so it changed nothing. Your
        announcement did not either.
      </li>
      <li>
        A binding commitment changes what you will want to do later, and so what others expect. Meena’s milk deal, signed before you arrived, made a price war
        her best move. Moving first, with a commitment others can see, kept the newcomer out.
      </li>
      <li>Commitment has a cost. Burn your bridges only when what it saves is worth more than what it costs, as with Asha and not with Farhan.</li>
    </ul>
  </section>
{/if}

<style>
  .lab-stage {
    min-height: 34rem;
  }
  h2 {
    margin: 0;
  }
  .says {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 600;
  }
  .setting {
    margin: 0;
  }
  .tree {
    margin: 0;
    padding: 10px 12px;
    border: 1px solid var(--rule);
    border-radius: var(--radius);
  }
  .tree figcaption {
    color: var(--ink-2);
    font-size: 0.9rem;
  }
  .tree ul {
    margin: 4px 0 0;
    padding-left: 1.4em;
  }
  .tree li {
    margin: 2px 0;
  }
  .pay {
    white-space: nowrap;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .step {
    margin: 0;
    padding: 0;
    border: 0;
  }
  .step legend {
    margin-bottom: 6px;
    padding: 0;
    font-weight: 600;
  }
  .button[aria-pressed='true'] {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }
</style>
