<script lang="ts">
  import { markMet } from '../../lib/meet';
  import { isIndian, readerLocale } from '../../lib/money';
  import { tick } from 'svelte';
  import { aboveText, amount, anchorRounds, change, figure, firstNumber, ITEMS, pullText, summarise, type Round } from '../../lib/labs/anchoring';
  import { shuffle } from '../../lib/labs/seeded';

  /**
   * First number wins?: six estimates, each just after someone else's first
   * number (high for one item of each kind, low for the other), then the same
   * six again after a reason each way. The estimates and reasons live only in
   * this component: they are never saved or sent. Playing to the end is recorded
   * as played, like every lab.
   */
  const COUNT = ITEMS.length;

  // Replaced whole, never changed in place: no need for deep reactivity.
  let rounds = $state.raw<Round[]>([]);
  let again = $state.raw<Round[]>([]);
  let first = $state<Record<string, number>>({});
  let second = $state<Record<string, number>>({});
  let part = $state<1 | 2>(1);
  let compared = $state(false);
  let estimate = $state<number>();
  let tooHigh = $state('');
  let tooLow = $state('');
  let debrief = $state(false);
  let indian = $state(true);
  let headEl = $state<HTMLElement>();
  let inputEl = $state<HTMLInputElement>();
  let statusEl = $state<HTMLElement>();
  let debriefEl = $state<HTMLElement>();

  const done = $derived(part === 1 ? Object.keys(first).length : Object.keys(second).length);
  const round = $derived((part === 1 ? rounds : again)[done]);
  const between = $derived(rounds.length > 0 && part === 1 && done === COUNT);
  const over = $derived(part === 2 && done === COUNT);
  const show = (r: Round, n: number) => amount(r.item, n, indian);
  const bare = (r: Round, n: number) => figure(r.item, n, indian);
  const withEstimates = (answers: Record<string, number>) => rounds.map((r) => ({ ...r, estimate: answers[r.item.id]! }));
  const before = $derived(over ? summarise(withEstimates(first)) : undefined);
  const after = $derived(over ? summarise(withEstimates(second)) : undefined);
  const rows = $derived(ITEMS.map((item) => rounds.find((r) => r.item.id === item.id)!));

  async function focus(el: () => HTMLElement | undefined) {
    await tick();
    el()?.focus();
  }

  function start() {
    indian = isIndian(readerLocale());
    rounds = anchorRounds(Math.random);
    [again, first, second, part, compared, estimate, debrief] = [[], {}, {}, 1, false, undefined, false];
    focus(() => headEl);
  }

  function compare() {
    compared = true;
    focus(() => inputEl);
  }

  function submit(event: SubmitEvent) {
    event.preventDefault();
    if (!round || !(typeof estimate === 'number' && estimate > 0)) return;
    if (part === 2 && !(tooHigh.trim() && tooLow.trim())) return;
    (part === 1 ? first : second)[round.item.id] = estimate;
    [estimate, compared, tooHigh, tooLow] = [undefined, false, '', ''];
    if (part === 2 && done === COUNT) {
      // Played to the end: the lab is met, its questions open up in practice, and the progress page shows when.
      markMet('labs/first-number');
      focus(() => statusEl);
    } else focus(() => (between ? statusEl : headEl));
  }

  function startAgain() {
    [again, part] = [shuffle(rounds, Math.random), 2];
    focus(() => headEl);
  }

  function showDebrief() {
    debrief = true;
    focus(() => debriefEl);
  }
</script>

<div class="lab card">
  <div class="lab-stage">
    {#if !rounds.length}
      <p>
        You will make six estimates: two monthly rents, two crowds at a college festival and two project times. Each case gives you a range to work from. Just
        before you answer, someone names a number first.
      </p>
      <p>
        Then you make the same six estimates again. This time, before each one, you write one reason that first number could be too high and one reason it could
        be too low.
      </p>
      <p class="lab-note">There is no score to win. Answer as you would for real. What you type stays in this page: it is not saved or sent anywhere.</p>
      <div class="lab-actions">
        <button class="button primary" type="button" onclick={start}>Start</button>
      </div>
    {:else if between}
      <p class="lab-status" tabindex="-1" bind:this={statusEl} aria-live="polite" data-testid="fn-status">
        Part 1 is done. Now the same six cases again, with the same first numbers. Before each estimate, write one reason the first number could be too high and
        one reason it could be too low. A few words each is enough.
      </p>
      <div class="lab-actions">
        <button class="button primary" type="button" onclick={startAgain}>Start part 2</button>
      </div>
    {:else if round}
      <h2 tabindex="-1" bind:this={headEl} data-testid="fn-round">Part {part}: estimate {done + 1} of {COUNT}</h2>
      <p class="setting">{round.item.text}</p>
      <p class="first" data-testid="fn-first" data-anchor={round.anchor}>{firstNumber(round, indian)}</p>
      {#if part === 1 && !compared}
        <p class="ask">Is the answer above or below {show(round, round.anchor)}?</p>
        <div class="lab-actions">
          <button class="button" type="button" onclick={compare}>Above</button>
          <button class="button" type="button" onclick={compare}>Below</button>
        </div>
      {:else}
        <form class="estimate" onsubmit={submit}>
          {#if part === 2}
            <label for="fn-high">One reason {show(round, round.anchor)} could be too high</label>
            <input id="fn-high" class="reason" type="text" maxlength="200" required bind:value={tooHigh} />
            <label for="fn-low">One reason it could be too low</label>
            <input id="fn-low" class="reason" type="text" maxlength="200" required bind:value={tooLow} />
          {/if}
          <label for="fn-estimate">{round.item.ask}</label>
          <div class="lab-actions">
            <input id="fn-estimate" class="number" type="number" inputmode="numeric" min="1" step="1" required bind:value={estimate} bind:this={inputEl} />
            <button class="button primary" type="submit">Next</button>
          </div>
        </form>
      {/if}
    {:else if over && before && after}
      <p class="lab-status" tabindex="-1" bind:this={statusEl} aria-live="polite" data-testid="fn-status">
        Done: twelve estimates. Without reasons, you moved {pullText(before.pull)}. After a reason each way, you moved {pullText(after.pull)}.
      </p>
      <div class="lab-actions">
        <button class="button primary" type="button" onclick={showDebrief} disabled={debrief}>See the debrief</button>
        <button class="button" type="button" onclick={start}>Play again</button>
      </div>
    {/if}
  </div>
</div>

{#if debrief && before && after}
  {@const moved = change(before.pull, after.pull)}
  <section class="lab-debrief" data-testid="fn-debrief">
    <h2 tabindex="-1" bind:this={debriefEl}>Debrief</h2>
    <div class="lab-scroll">
      <table class="lab-table">
        <thead>
          <tr><th>Case</th><th class="num">First number</th><th class="num">Lab’s value</th><th class="num">Part 1</th><th class="num">Part 2</th></tr>
        </thead>
        <tbody>
          {#each rows as r (r.item.id)}
            <tr>
              <td>{r.item.name} <span class="unit">{r.item.unit}</span></td>
              <td class="num">{bare(r, r.anchor)} <span class="unit">{r.side}</span></td>
              <td class="num">{bare(r, r.item.value)}</td>
              <td class="num">{bare(r, first[r.item.id]!)}</td>
              <td class="num you">{bare(r, second[r.item.id]!)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="how">
      The lab’s value for each case is the middle of the range it gave you. The first numbers were set by the lab: high for one case of each kind and low for
      the other, picked at random each time you play, and always outside the range. The wheel was set too.
    </p>
    <p data-testid="fn-summary">
      In part 1, after a high first number your estimates were {aboveText(before.high)} on average. After a low one, they were {aboveText(before.low)}. In all,
      you moved {pullText(before.pull)}.
      {#if before.pull >= 0.1}
        So the first numbers moved your answers, though the ranges you were given stayed the same.
      {:else}
        The first numbers barely moved you: you held to the ranges you were given.
      {/if}
    </p>
    <p data-testid="fn-change">
      In part 2, after a reason each way, you moved {pullText(after.pull)}.
      {#if moved === 'less'}
        The pull got smaller.
      {:else if moved === 'more'}
        The pull got larger this time. Giving reasons does not always help at once.
      {:else}
        The pull stayed about the same.
      {/if}
      Six estimates are few, and part 2 was a second look at the same cases, which can help on its own. Treat this as a hint about you, not a measurement.
    </p>
    <p>
      Researchers found the same pull with a wheel that could not have meant anything. Tversky and Kahneman (1974) asked what share of the countries in the
      United Nations were African, after a wheel stopped at 10 or at 65. The typical answer was 25% after 10, and 45% after 65. Later, Mussweiler, Strack and
      Pfeiffer (2000) asked car experts to price a used car after hearing a seller’s figure. The experts who first listed reasons the figure might be wrong were
      pulled less.
    </p>
    <h3>What it shows</h3>
    <ul class="lab-lesson">
      <li>A first number pulls the estimates that follow it, even one that plainly means nothing, like the wheel. This is called anchoring.</li>
      <li>
        The fix is to consider the opposite. Before you estimate, give one reason the number could be too high and one it could be too low. Then work out your
        own figure from what you know.
      </li>
      <li>
        In a negotiation, the first offer pulls the final price towards it (Galinsky and Mussweiler 2001). When you know what something is worth, make the first
        offer yourself, with your reasons. When the other side goes first, do not bargain from their number: name your own number and say why.
      </li>
      <li>In a group, have everyone write their estimate before anyone speaks, so that no single first number pulls them all.</li>
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
  .setting {
    margin: 0;
    font-size: 1.1rem;
  }
  .first {
    margin: 0;
    padding: 10px 14px;
    border-left: 4px solid var(--ink);
    background: var(--paper);
    font-weight: 600;
  }
  .ask {
    margin: 0;
  }
  .estimate {
    display: grid;
    gap: 6px;
  }
  .estimate label {
    font-weight: 600;
  }
  .estimate .lab-actions {
    margin-top: 2px;
  }
  input {
    min-height: 44px;
    padding: 8px 12px;
    border: 1px solid var(--rule-strong);
    border-radius: var(--radius);
    background: var(--paper);
    color: var(--ink);
    font: 1rem var(--sans);
  }
  .reason {
    width: 100%;
    max-width: 36rem;
    box-sizing: border-box;
    margin-bottom: 8px;
  }
  .unit {
    display: block;
    color: var(--ink-2);
    font-size: 0.85rem;
  }
  .how {
    color: var(--ink-2);
  }
  .number {
    width: 9em;
    font-weight: 600;
    font-size: 1.1rem;
  }
</style>
