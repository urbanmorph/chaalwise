<script lang="ts">
  import { markMet } from '../../lib/meet';
  import { tick } from 'svelte';
  import { framingRounds, restated, shown, tally, type Answer, type FramingRound, type Pick } from '../../lib/labs/framing';

  /** Gain or loss?: eight choices, each asked once as a gain and once as a loss, then where the answers changed. */
  let rounds = $state<FramingRound[]>([]);
  let answers = $state<Answer[]>([]);
  let debrief = $state(false);
  let headEl = $state<HTMLElement>();
  let statusEl = $state<HTMLElement>();
  let debriefEl = $state<HTMLElement>();

  const round = $derived(rounds[answers.length]);
  const over = $derived(rounds.length > 0 && answers.length === rounds.length);
  const result = $derived(tally(answers));
  const pickText = (p: Pick | undefined) => (p === 'sure' ? 'Sure thing' : 'Gamble');

  async function focus(el: () => HTMLElement | undefined) {
    await tick();
    el()?.focus();
  }

  function start() {
    [rounds, answers, debrief] = [framingRounds(Math.random), [], false];
    focus(() => headEl);
  }

  function choose(pick: Pick) {
    if (!round) return;
    answers.push({ round, pick });
    if (answers.length < rounds.length) focus(() => headEl);
    else {
      // Played to the end: the lab is met, its questions open up in practice, and the progress page shows when.
      markMet('labs/gain-or-loss');
      focus(() => statusEl);
    }
  }

  function showDebrief() {
    debrief = true;
    focus(() => debriefEl);
  }
</script>

<div class="lab card">
  <div class="lab-stage">
    {#if !rounds.length}
      <p>Eight choices, each between plan A, a sure thing, and plan B, a gamble. There is no right answer. Pick the plan you would rather have.</p>
      <p class="lab-note">Answer as you would for real, and do not look back. The lab shows what your answers have in common at the end.</p>
      <div class="lab-actions">
        <button class="button primary" type="button" onclick={start}>Start</button>
      </div>
    {:else if round}
      {@const s = shown(round.scenario, round.frame)}
      <h2 tabindex="-1" bind:this={headEl} data-testid="gl-round">Choice {answers.length + 1} of {rounds.length}</h2>
      <p class="setting">{s.intro}</p>
      <div class="plans">
        <button class="button plan" type="button" onclick={() => choose('sure')}><strong>Plan A</strong> {s.sure}</button>
        <button class="button plan" type="button" onclick={() => choose('gamble')}><strong>Plan B</strong> {s.gamble}</button>
      </div>
    {/if}
    {#if over}
      <p class="lab-status" tabindex="-1" bind:this={statusEl} aria-live="polite" data-testid="gl-status">
        Done. You met each of four choices twice: once put as what is kept, once as what is lost. Your answer changed with the wording in {result.flipped} of 4.
      </p>
      <div class="lab-actions">
        <button class="button primary" type="button" onclick={showDebrief} disabled={debrief}>See the debrief</button>
        <button class="button" type="button" onclick={start}>Play again</button>
      </div>
    {/if}
  </div>
</div>

{#if debrief}
  <section class="lab-debrief" data-testid="gl-debrief">
    <h2 tabindex="-1" bind:this={debriefEl}>Debrief</h2>
    <div class="lab-scroll">
      <table class="lab-table">
        <thead><tr><th>The choice, said plainly</th><th>Put as a gain</th><th>Put as a loss</th></tr></thead>
        <tbody>
          {#each result.rows as r (r.scenario.id)}
            <tr>
              <td><strong>{r.scenario.name}.</strong> {restated(r.scenario)}</td>
              <td class="pick" class:you={r.flipped}>{pickText(r.gain)}</td>
              <td class="pick" class:you={r.flipped}>{pickText(r.loss)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="lab-note">Bold answers changed with the wording alone.</p>
    <p data-testid="gl-summary">
      You took the sure thing {result.sureInGain} times of 4 when it was put as a gain, and {result.sureInLoss} times of 4 when it was put as a loss.
      {#if result.flipped === 0}
        Your answers held whichever way the choice was put: the wording did not move you here.
      {:else}
        In {result.flipped} of 4 the same choice got a different answer{result.usual
          ? `, ${result.usual} of them the usual way: sure when it was a gain, a gamble when it was a loss`
          : ''}.
      {/if}
    </p>
    <p>
      When Tversky and Kahneman (1981) asked people the classic version, about a disease and 600 lives, 72% took the sure plan when it was put as lives saved.
      Put as deaths, 78% took the gamble. The plans were the same.
    </p>
    <h3>What it shows</h3>
    <ul class="lab-lesson">
      <li>With gains, people tend to play safe; facing a sure loss, they tend to gamble to avoid it. That is why the wording can flip the choice.</li>
      <li>The wording sets what counts as a gain or a loss. Change the wording and the choice can change, though the facts have not.</li>
      <li>
        Neither plan is wrong: each pair keeps the same on average. What is hard to defend is choosing differently because of the words. Before you decide, say
        the choice the other way, or as plain end states, and see whether your answer holds.
      </li>
      <li>The same pull shows after a setback: a loss you want to undo makes long shots look better than they are.</li>
    </ul>
  </section>
{/if}

<style>
  .lab-stage {
    min-height: 22rem;
  }
  h2 {
    margin: 0;
  }
  .setting {
    margin: 0;
    font-size: 1.15rem;
  }
  .plans {
    display: grid;
    gap: 10px;
  }
  .button.plan {
    display: block;
    width: 100%;
    min-height: 56px;
    padding: 12px 16px;
    text-align: left;
    white-space: normal;
    line-height: 1.4;
  }
  .pick {
    white-space: nowrap;
  }
  .plan strong {
    display: block;
  }
</style>
