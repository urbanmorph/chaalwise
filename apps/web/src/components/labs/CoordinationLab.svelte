<script lang="ts">
  import { markMet } from '../../lib/meet';
  import { tick } from 'svelte';
  import {
    CROWD,
    defectRound,
    drawMeets,
    expectedMatches,
    focal,
    HUNTERS,
    HUNTS,
    huntPoints,
    MEETS,
    playHunt,
    tally,
    type Hunt,
    type HuntRound,
    type Signal,
  } from '../../lib/labs/coordination';

  /**
   * Pick the same: four meet-ups matching a crowd of bots with no way to talk,
   * then eight stag hunts where all five hunters must go for the stag.
   */

  type Phase = 'intro' | 'meet' | 'hunt' | 'done';

  let phase = $state<Phase>('intro');
  let crowds = $state<{ match: number[]; like: number[] }[]>([]);
  let picks = $state<number[]>([]);
  let hunts = $state<HuntRound[]>([]);
  let defectAt = $state(6);
  let showing = $state(false);
  /** A word said this hunt, waiting for the choice of stag or hare. */
  let said = $state<Signal>();
  let debrief = $state(false);
  let headEl = $state<HTMLElement>();
  let statusEl = $state<HTMLElement>();
  let debriefEl = $state<HTMLElement>();

  const meetIndex = $derived(showing ? picks.length - 1 : picks.length);
  const meet = $derived(MEETS[meetIndex]);
  const matched = (i: number) => crowds[i]!.match.filter((p) => p === picks[i]).length;
  const meetTotal = $derived(picks.reduce((s, _, i) => s + matched(i), 0));
  const focalExpected = Math.round(MEETS.reduce((s, m) => s + expectedMatches(m, focal(m)), 0));
  const randomExpected = Math.round(MEETS.reduce((s, m) => s + CROWD / m.options.length, 0));
  const huntTotal = $derived(hunts.reduce((s, r) => s + huntPoints(r.you, r.caught), 0));
  const caught = $derived(hunts.filter((r) => r.caught).length);
  const hunt = $derived(hunts.at(-1));
  const name = (id: string) => HUNTERS.find((h) => h.id === id)!.name;
  const hares = (r: HuntRound) => HUNTERS.filter((h) => r.bots[h.id] === 'hare').map((h) => h.name);
  const SAID: Record<Signal, string> = { none: 'Nothing', word: '“I’ll hunt the stag”', first: 'Set out first' };

  async function focus(el: () => HTMLElement | undefined) {
    await tick();
    el()?.focus();
  }

  function start() {
    [crowds, picks, hunts, defectAt, showing, said, debrief, phase] = [
      drawMeets(Math.random),
      [],
      [],
      defectRound(Math.random),
      false,
      undefined,
      false,
      'meet',
    ];
    focus(() => headEl);
  }

  function choose(option: number) {
    if (showing) return;
    picks.push(option);
    showing = true;
    focus(() => statusEl);
  }

  function next() {
    showing = false;
    said = undefined;
    if (phase === 'meet' && picks.length === MEETS.length) phase = 'hunt';
    focus(() => headEl);
  }

  function signal(s: Signal) {
    if (s === 'first') huntWith(s, 'stag');
    else said = s;
  }

  function huntWith(s: Signal, you: Hunt) {
    hunts.push(playHunt(hunts, s, you, defectAt));
    [said, showing] = [undefined, true];
    // Played to the end: the lab is met, its questions open up in practice, and the progress page shows when.
    if (hunts.length === HUNTS) {
      phase = 'done';
      markMet('labs/pick-the-same');
    }
    focus(() => statusEl);
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
        Two parts. First, four meet-ups: you and a crowd of {CROWD} bots each choose from the same options, with no way to talk. You score one for every bot that
        chose what you chose. The bots are trying to match you too.
      </p>
      <p>
        Then eight hunts, after Rousseau's story of the stag hunt. Five hunters, you and four bots: a stag feeds everyone well (6 points each), but only if all
        five go for it. A hare can be caught alone (3 points, for sure). Before each hunt you can tell the others what you plan, or set out first where they can
        see.
      </p>
      <p class="lab-note">Points only; nothing to win or buy. A few minutes in all.</p>
      <div class="lab-actions">
        <button class="button primary" type="button" onclick={start}>Start</button>
      </div>
    {:else if phase === 'meet' && meet}
      {@const i = meetIndex}
      <h2 tabindex="-1" bind:this={headEl} data-testid="cw-head">Meet-up {i + 1} of {MEETS.length}</h2>
      <p class="setting">{meet.prompt}</p>
      <div class={meet.grid ? 'grid' : 'options'}>
        {#each meet.options as option, o (o)}
          <button
            class="button option"
            class:shaded={meet.grid && o === focal(meet)}
            class:picked={showing && picks[i] === o}
            type="button"
            aria-label={option}
            aria-pressed={showing ? picks[i] === o : undefined}
            disabled={showing}
            onclick={() => choose(o)}>{meet.grid ? '' : option}</button
          >
        {/each}
      </div>
      {#if showing}
        {@const counts = tally(crowds[i]!.match, meet.options.length)}
        {@const likes = tally(crowds[i]!.like, meet.options.length)}
        <p class="lab-status" tabindex="-1" bind:this={statusEl} aria-live="polite" data-testid="cw-status">
          You matched {matched(i)} of {CROWD} bots.
          {#if picks[i] === focal(meet)}You picked what stands out.{:else}Most bots went for {meet.options[focal(meet)]}: it stands out to everyone.{/if}
        </p>
        <table class="lab-table bars">
          <thead><tr><th>Option</th><th class="num">Trying to match</th><th class="num">Their own favourite</th></tr></thead>
          <tbody>
            {#each meet.options as option, o (o)}
              <tr class:you={picks[i] === o}>
                <td>{option}{picks[i] === o ? ' (you)' : ''}</td>
                <td class="num">{counts[o]}</td>
                <td class="num">{likes[o]}</td>
              </tr>
            {/each}
          </tbody>
        </table>
        <p class="lab-note" data-testid="cw-like">
          Trying to match you, {counts[focal(meet)]} of {CROWD} bots picked what stands out. Asked for their own favourite instead, {likes[focal(meet)]} did: what
          people like varies more than what they all notice.
        </p>
        <div class="lab-actions">
          <button class="button primary" type="button" onclick={next}>{i < MEETS.length - 1 ? 'Next meet-up' : 'On to the hunt'}</button>
        </div>
      {/if}
    {:else}
      <h2 tabindex="-1" bind:this={headEl} data-testid="cw-head">Hunt {hunts.length + (showing ? 0 : 1)} of {HUNTS}</h2>
      <dl class="lab-score">
        <div>
          <dt>Your points</dt>
          <dd data-testid="cw-you">{huntTotal}</dd>
        </div>
        <div>
          <dt>Stags caught</dt>
          <dd data-testid="cw-caught">{caught}</dd>
        </div>
      </dl>
      <ul class="hunters" data-testid="cw-hunters">
        {#each HUNTERS as h (h.id)}
          <li>
            <strong>{h.name}</strong>
            {#if showing && hunt}<span class={hunt.bots[h.id] === 'stag' ? 'tag-c' : 'tag-d'}>{h.name} hunted a {hunt.bots[h.id]}.</span>{:else}<span
                >{h.style}</span
              >{/if}
          </li>
        {/each}
      </ul>
      {#if !showing}
        {#if !said}
          <p class="setting">
            A stag: 6 points each if all five go for it, nothing if anyone does not. A hare: 3 points, for sure. What do you tell the others first?
          </p>
          <div class="lab-actions">
            <button class="button" type="button" onclick={() => signal('none')}>Say nothing</button>
            <button class="button" type="button" onclick={() => signal('word')}>Say “I’ll hunt the stag”</button>
            <button class="button primary" type="button" onclick={() => signal('first')}>Set out first, where all can see</button>
          </div>
          <p class="lab-note">Setting out first commits you to the stag.</p>
        {:else}
          <p class="setting">{said === 'word' ? 'You told them you will hunt the stag.' : 'You said nothing.'} Now choose.</p>
          <div class="lab-actions">
            <button class="button primary" type="button" onclick={() => huntWith(said!, 'stag')}>Hunt the stag</button>
            <button class="button" type="button" onclick={() => huntWith(said!, 'hare')}>Hunt a hare</button>
          </div>
        {/if}
      {:else if hunt}
        <p class="lab-status" tabindex="-1" bind:this={statusEl} aria-live="polite" data-testid="cw-status">
          {#if hunt.caught}
            All five went for the stag, and caught it: 6 points each.
          {:else if hunt.you === 'hare'}
            You caught a hare: 3 points. {hares(hunt).length === 4 ? 'So did everyone else.' : 'The stag got away: one hare hunter is enough to lose it.'}
          {:else}
            The stag got away: {hares(hunt).join(' and ')} hunted a hare, and you got nothing.
          {/if}
          {#if hunts.length === defectAt && hunt.bots.dev === 'hare'}Dev took a better offer elsewhere today.{/if}
        </p>
        <div class="lab-actions">
          {#if phase !== 'done'}
            <button class="button primary" type="button" onclick={next}>Next hunt</button>
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
  <section class="lab-debrief" data-testid="cw-debrief">
    <h2 tabindex="-1" bind:this={debriefEl}>Debrief</h2>
    <h3>Meeting without a word</h3>
    <div class="lab-scroll">
      <table class="lab-table">
        <thead><tr><th>Meet-up</th><th>You picked</th><th class="num">Matched</th><th>What stood out</th></tr></thead>
        <tbody>
          {#each MEETS as m, i (i)}
            <tr>
              <td>{i + 1}</td>
              <td>{m.options[picks[i]!]}</td>
              <td class="num you">{matched(i)} of {CROWD}</td>
              <td>{m.options[focal(m)]}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <h3>The stag hunt</h3>
    <div class="lab-scroll">
      <table class="lab-table">
        <thead><tr><th>Hunt</th><th>You said</th><th>You hunted</th><th>Hare hunters</th><th class="num">Points</th></tr></thead>
        <tbody>
          {#each hunts as r, i (i)}
            <tr>
              <td>{i + 1}</td>
              <td>{SAID[r.signal]}</td>
              <td class={r.you === 'stag' ? 'tag-c' : 'tag-d'}>{r.you}</td>
              <td>{r.caught ? 'None' : [...(r.you === 'hare' ? ['You'] : []), ...hares(r)].join(', ')}</td>
              <td class="num you">{huntPoints(r.you, r.caught)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p data-testid="cw-summary">
      You matched {meetTotal} of {MEETS.length * CROWD} bots in the meet-ups; picking what stands out each time matches about {focalExpected} on average, picking
      at random about {randomExpected}. In the hunt you scored {huntTotal} points. Always hunting a hare scores {HUNTS * 3} for sure; going first every time would
      have scored {(HUNTS - 1) * 6}, losing only the stag on the day {name('dev')} took a better offer (hunt {defectAt}).
    </p>
    <h3>What it shows</h3>
    <ul class="lab-lesson">
      <li>
        When everyone gains by choosing alike, the question is not “which do I like?” but “which will we all think of?”. Pick what stands out to everyone: the
        obvious place, the round time, the odd one out. Schelling called it a focal point.
      </li>
      <li>
        A bigger prize that needs everyone is reached only if each trusts the rest. Someone who was let down before plays safe, and they are not wrong to: one
        hare hunter loses the stag for all.
      </li>
      <li>
        Words reach the trusting, but not the burned. A commitment others can see, or a record of it working, does. Keep your word, or even words stop working.
      </li>
      <li>After one person lets the group down, trust has to be rebuilt: go first again rather than assume the old record still holds.</li>
    </ul>
  </section>
{/if}

<style>
  .lab-stage {
    min-height: 30rem;
  }
  h2 {
    margin: 0;
  }
  .setting {
    margin: 0;
    font-size: 1.1rem;
  }
  .options {
    display: grid;
    gap: 8px;
  }
  .button.option {
    min-height: 48px;
    padding: 10px 16px;
    text-align: left;
    white-space: normal;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(3, 64px);
    gap: 6px;
  }
  .grid .button.option {
    width: 64px;
    height: 64px;
    padding: 0;
  }
  .grid .shaded {
    background: var(--ink-2);
  }
  .button.picked {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }
  .button.option:disabled {
    opacity: 1;
    cursor: default;
  }
  .bars tr.you td {
    font-weight: 700;
  }
  .hunters {
    display: grid;
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .hunters strong {
    display: inline-block;
    min-width: 3.5em;
  }
  .hunters span:not(.tag-c, .tag-d) {
    color: var(--ink-2);
  }
</style>
