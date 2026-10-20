<script lang="ts">
  import { tick } from 'svelte';
  import { disconfirming, drawRounds, RULES, score, telling, validTriple, type Played, type RuleId, type Triple } from '../../lib/labs/rule-finder';

  /** The rule finder, after Wason's 2-4-6 task: three hidden rules, tested with the learner's own numbers, then a debrief. */
  interface Test {
    triple: Triple;
    yes: boolean;
    /** The learner's guess said it would get a no: it could have proved the guess wrong. */
    disconfirming: boolean;
  }

  // The first round is always 2, 4, 6, so the page drawn at build time matches.
  let rounds = $state(drawRounds(Math.random));
  let at = $state(0);
  let guess = $state<RuleId>();
  let nums = $state<(number | undefined)[]>([undefined, undefined, undefined]);
  let tests = $state<Test[]>([]);
  let pick = $state<RuleId>();
  let played = $state<Played[]>([]);
  let status = $state('Pick your guess, then test it with three numbers of your own.');
  let debrief = $state(false);
  let formEl = $state<HTMLFormElement>();
  let statusEl = $state<HTMLElement>();
  let debriefEl = $state<HTMLElement>();

  const round = $derived(rounds[at]!);
  const totals = $derived(score(played));
  const found = $derived(played.filter((p) => p.pick === p.hidden).length);
  const show = (t: readonly number[]) => t.join(', ');
  const quote = (id: RuleId) => `“${RULES[id].text}”`;
  const LABELS = ['First number', 'Second number', 'Third number'];

  function test(event: SubmitEvent) {
    event.preventDefault();
    if (pick) return;
    if (!guess) {
      status = 'Pick your guess first, then test it.';
      return;
    }
    const triple = nums.map((n) => (typeof n === 'number' ? n : Number.NaN));
    if (!validTriple(triple)) {
      status = 'Type three whole numbers, from -999 to 999.';
      return;
    }
    const yes = RULES[round.hidden].test(triple);
    const predicted = RULES[guess].test(triple);
    tests.push({ triple, yes, disconfirming: disconfirming(guess, triple) });
    status = `${show(triple)}: ${yes ? 'yes, it fits the rule' : 'no, it does not fit'}. ${
      yes === predicted ? 'Your guess said so too.' : `Your guess said it would${predicted ? '' : ' not'}, so your guess is wrong.`
    }`;
    formEl?.querySelector('input')?.select();
  }

  async function announce() {
    if (!guess || pick) {
      if (!guess) status = 'Pick the rule you think it is first.';
      return;
    }
    pick = guess;
    played.push({ hidden: round.hidden, pick, tests: tests.map((t) => ({ disconfirming: t.disconfirming })) });
    const could = tests.filter((t) => t.disconfirming).length;
    const tell = telling(round, pick);
    const lead =
      pick === round.hidden
        ? `Right: the rule is ${quote(round.hidden)}.`
        : `Not this time: the rule is ${quote(round.hidden)}. Testing ${show(tell)} would have shown it: ${
            RULES[round.hidden].test(tell) ? 'it fits the rule, but not your guess' : 'it fits your guess, but not the rule'
          }.`;
    status = `${lead} ${could} of your ${tests.length} tests could have proved your guess wrong.`;
    await tick();
    statusEl?.focus();
  }

  async function next() {
    [at, guess, nums, tests, pick] = [at + 1, undefined, [undefined, undefined, undefined], [], undefined];
    status = 'A new rule. Pick your guess, then test it.';
    await tick();
    formEl?.querySelector('input')?.focus();
  }

  async function showDebrief() {
    debrief = true;
    await tick();
    debriefEl?.focus();
  }

  async function again() {
    rounds = drawRounds(Math.random);
    [played, debrief, at] = [[], false, -1];
    await next();
  }
</script>

<div class="lab card">
  <div class="lab-stage">
    <dl class="lab-score">
      <div>
        <dt>Round</dt>
        <dd data-testid="rf-round">{at + 1} <span class="of">of {rounds.length}</span></dd>
      </div>
      <div>
        <dt>Rules found</dt>
        <dd data-testid="rf-found">{found}</dd>
      </div>
      <div>
        <dt>Tests this round</dt>
        <dd>{tests.length}</dd>
      </div>
    </dl>
    <p class="start">These fit the rule: <strong data-testid="rf-start">{show(round.start)}</strong></p>
    <fieldset class="guess" disabled={!!pick}>
      <legend>Your guess</legend>
      {#each round.options as id (id)}
        <label><input type="radio" name="guess" value={id} bind:group={guess} /> {RULES[id].text}</label>
      {/each}
    </fieldset>
    <form class="test" onsubmit={test} bind:this={formEl}>
      <fieldset disabled={!!pick}>
        <legend>Test three numbers</legend>
        <div class="lab-actions">
          {#each LABELS as label, i (label)}
            <input type="number" inputmode="numeric" step="1" aria-label={label} bind:value={nums[i]} />
          {/each}
          <button class="button primary" type="submit">Test</button>
        </div>
      </fieldset>
    </form>
    <p class="lab-status" aria-live="polite" tabindex="-1" bind:this={statusEl} data-testid="rf-status">{status}</p>
    <div class="lab-actions">
      {#if !pick}
        <button class="button" type="button" onclick={announce}>That is the rule</button>
      {:else if at + 1 < rounds.length}
        <button class="button primary" type="button" onclick={next}>Next round</button>
      {:else}
        <button class="button primary" type="button" onclick={showDebrief} disabled={debrief}>See the debrief</button>
      {/if}
    </div>
    <div class="lab-scroll tests">
      <table class="lab-table">
        <caption class="lab-note">Your tests this round</caption>
        <thead><tr><th>Numbers</th><th>Fits the rule?</th><th>Could it prove your guess wrong?</th></tr></thead>
        <tbody>
          {#each tests as t, i (i)}
            <tr>
              <td>{show(t.triple)}</td>
              <td class={t.yes ? 'tag-c' : 'tag-d'}>{t.yes ? 'Yes' : 'No'}</td>
              <td>{t.disconfirming ? 'Yes: your guess said no' : 'No: your guess said yes'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

{#if debrief}
  <section class="lab-debrief" data-testid="rf-debrief">
    <h2 tabindex="-1" bind:this={debriefEl}>Debrief</h2>
    <div class="lab-scroll">
      <table class="lab-table">
        <thead>
          <tr><th>Round</th><th>Started with</th><th>The rule</th><th>Your answer</th><th class="num">Tests that could prove you wrong</th></tr>
        </thead>
        <tbody>
          {#each played as p, i (i)}
            <tr>
              <td>{i + 1}</td>
              <td>{show(rounds[i]!.start)}</td>
              <td>{RULES[p.hidden].text}</td>
              <td class={p.pick === p.hidden ? 'tag-c' : 'tag-d'}>{RULES[p.pick].text}</td>
              <td class="num">{p.tests.filter((t) => t.disconfirming).length} of {p.tests.length}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p data-testid="rf-summary">
      You found {totals.found} of {totals.rounds} rules. {totals.disconfirming} of your {totals.tests} tests were ones your guess said should get a no: the only kind
      that can show a guess is wrong when the rule is wider than it.
    </p>
    <h3>What it shows</h3>
    <ul class="lab-lesson">
      <li>
        Most people test only cases they expect to fit. Each one gets a yes, so they grow sure and never find out they are wrong. In Wason's 2-4-6 study (1960),
        only about one person in five found the rule at the first try.
      </li>
      <li>
        A yes to a test your guess predicts fits many other rules too, so it tells you little. A test your guess says should fail is the one that can surprise
        you.
      </li>
      <li>This is confirmation bias: looking for, and giving weight to, evidence that agrees with what you already think.</li>
      <li>In work, before backing a plan, ask what result would show it is wrong, and go and look for that result.</li>
    </ul>
    <button class="button" type="button" onclick={again}>Play again</button>
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
  .start {
    margin: 0;
    font-size: 1.1rem;
  }
  .start strong {
    font-family: var(--mono);
    font-size: 1.4rem;
  }
  fieldset {
    margin: 0;
    padding: 0;
    border: 0;
    min-width: 0;
  }
  legend {
    padding: 0;
    margin-bottom: 6px;
    font-weight: 600;
  }
  .guess label {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 3px 0;
  }
  .test input {
    width: 5.5em;
    min-height: 44px;
    padding: 8px 12px;
    border: 1px solid var(--rule-strong);
    border-radius: var(--radius);
    background: var(--paper);
    color: var(--ink);
    font: 600 1.1rem var(--sans);
  }
  .tests {
    min-height: 9rem;
  }
  .tests caption {
    text-align: left;
    caption-side: top;
    font-size: 0.85rem;
  }
</style>
