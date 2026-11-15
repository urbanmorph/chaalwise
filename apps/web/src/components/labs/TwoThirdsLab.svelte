<script lang="ts">
  import { markMet } from '../../lib/meet';
  import { tick } from 'svelte';
  import {
    BOTS,
    chain,
    CROWDS,
    debriefReplays,
    DEPTHS,
    depthGuess,
    depthName,
    depthOf,
    drawCrowd,
    play,
    replay,
    REPLAYS,
    summarise,
    type Result,
  } from '../../lib/labs/two-thirds';

  /** Guess two-thirds: four rounds of picking 0 to 100 against crowds of bots that think to different depths. */
  interface Round {
    bots: number[];
    you: number;
    result: Result;
  }

  const ROUNDS = CROWDS.length;
  const WIN = 10;

  let rounds = $state.raw<Round[]>([]);
  let bots = $state.raw<number[]>([]);
  let started = $state(false);
  let guess = $state<number>();
  let debrief = $state(false);
  let headEl = $state<HTMLElement>();
  let statusEl = $state<HTMLElement>();
  let debriefEl = $state<HTMLElement>();

  /** Showing the result of the round just played. */
  const done = $derived(rounds.length > 0 && rounds.at(-1)!.bots === bots);
  const index = $derived(done ? rounds.length - 1 : rounds.length);
  const crowd = $derived(CROWDS[index]!);
  const last = $derived(rounds.at(-1));
  const won = $derived(rounds.filter((r) => r.result.youWon).length);
  /** 2nd, 3rd, 4th … 12th: the places a round's loser can come. */
  const ordinal = (n: number) => `${n}${n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`;
  const one = (x: number) => x.toFixed(1).replace(/\.0$/, '');
  const depthText = (k: number) => `${depthName(k)} (${depthGuess(k)})`;
  const summary = $derived(debrief ? summarise(rounds) : undefined);
  const sim = $derived(debrief ? debriefReplays() : undefined);
  const at = (k: number) => DEPTHS.indexOf(k);

  async function focus(el: () => HTMLElement | undefined) {
    await tick();
    el()?.focus();
  }

  function setUp() {
    bots = drawCrowd(CROWDS[rounds.length]!, Math.random).map((b) => b.guess);
    guess = undefined;
    focus(() => headEl);
  }

  function start() {
    started = true;
    setUp();
  }

  function submit(event: SubmitEvent) {
    event.preventDefault();
    if (typeof guess !== 'number' || !Number.isInteger(guess) || guess < 0 || guess > 100) return;
    rounds = [...rounds, { bots, you: guess, result: play(bots, guess) }];
    // Played to the end: the lab is met, its questions open up in practice, and the progress page shows when.
    if (rounds.length === ROUNDS) markMet('labs/guess-two-thirds');
    focus(() => statusEl);
  }

  function showDebrief() {
    debrief = true;
    focus(() => debriefEl);
  }

  /** Where a number sits on the line, from 0 to 100. */
  const x = (n: number) => 12 + n * 3.76;
  /** Bots with the same guess stack upwards. */
  const stacked = (list: number[]) => list.map((g, i) => ({ g, level: list.slice(0, i).filter((h) => h === g).length }));
</script>

<div class="lab card">
  <div class="lab-stage">
    <dl class="lab-score">
      <div>
        <dt>Round</dt>
        <dd data-testid="tt-round">{index + 1} <span class="of">of {ROUNDS}</span></dd>
      </div>
      <div>
        <dt>Your points</dt>
        <dd data-testid="tt-you">{won * WIN}</dd>
      </div>
      <div>
        <dt>Rounds won</dt>
        <dd>{won}</dd>
      </div>
    </dl>
    {#if !started}
      <p>
        You and {BOTS} bots each pick a whole number from 0 to 100. The winner is the one whose number is closest to two-thirds of the average of all twelve. So if
        the average is 30, the winning number is the one closest to 20.
      </p>
      <p>
        Four rounds, each against a different crowd. Before you pick, you are told who is in it. The bots do not all think alike: some pick at random, and some
        think further ahead. Win a round, or tie for it, and you get {WIN} points.
      </p>
      <div class="lab-actions">
        <button class="button primary" type="button" onclick={start}>Start the first round</button>
      </div>
    {:else}
      <h2 class="against" tabindex="-1" bind:this={headEl} data-testid="tt-head">
        {crowd.name} <span class="lab-note">{crowd.about}</span>
      </h2>
      {#if !done}
        <form class="guess" onsubmit={submit}>
          <label for="tt-guess">Your number, from 0 to 100</label>
          <div class="lab-actions">
            <input id="tt-guess" class="lab-number" type="number" inputmode="numeric" min="0" max="100" step="1" required bind:value={guess} />
            <button class="button primary" type="submit">Pick it</button>
          </div>
          <p class="lab-note">The winner is closest to two-thirds of the average, your number included.</p>
        </form>
      {:else if last}
        <svg class="line" viewBox="0 0 400 74" role="img" aria-label="Where the twelve numbers fell, from 0 to 100" data-testid="tt-line">
          <line x1={x(0)} x2={x(100)} y1="52" y2="52" class="axis" />
          {#each [0, 25, 50, 75, 100] as n (n)}
            <text x={x(n)} y="70" text-anchor="middle">{n}</text>
          {/each}
          <line x1={x(last.result.target)} x2={x(last.result.target)} y1="4" y2="56" class="target" />
          <text
            x={x(last.result.target) + (last.result.target > 70 ? -4 : 4)}
            y="12"
            class="target-label"
            text-anchor={last.result.target > 70 ? 'end' : 'start'}>Target {one(last.result.target)}</text
          >
          {#each stacked(last.bots) as b, i (i)}
            <circle cx={x(b.g)} cy={46 - b.level * 7} r="3.2" class="bot" />
          {/each}
          <path d={`M${x(last.you)} 52 l-6 10 h12 z`} class="you" />
        </svg>
        <p class="lab-note">Dots: the bots’ numbers. Triangle: yours, {last.you}. The bots picked {[...last.bots].sort((a, b) => a - b).join(', ')}.</p>
      {/if}
      <p class="lab-status" tabindex="-1" bind:this={statusEl} aria-live="polite" data-testid="tt-status">
        {#if done && last}
          The average was {one(last.result.average)}, so the target, two-thirds of it, was {one(last.result.target)}. The winning number was {last.result.winning.join(
            ' and ',
          )}.
          {last.result.youWon
            ? `You won: +${WIN} points.`
            : `Yours, ${last.you}, was ${one(last.result.yourDistance)} away: ${ordinal(last.result.rank)} of 12.`}
        {/if}
      </p>
      {#if done}
        <div class="lab-actions">
          {#if rounds.length < ROUNDS}
            <button class="button primary" type="button" onclick={setUp}>Next round</button>
          {:else}
            <button class="button primary" type="button" onclick={showDebrief} disabled={debrief}>See the debrief</button>
          {/if}
        </div>
      {/if}
    {/if}
  </div>
</div>

{#if debrief && summary && sim}
  <section class="lab-debrief" data-testid="tt-debrief">
    <h2 tabindex="-1" bind:this={debriefEl}>Debrief</h2>
    <div class="lab-scroll">
      <table class="lab-table">
        <thead>
          <tr><th>Crowd</th><th class="num">Yours</th><th>Steps ahead</th><th class="num">Average</th><th class="num">Target</th><th class="num">Winner</th></tr
          >
        </thead>
        <tbody>
          {#each rounds as r, i (i)}
            <tr>
              <td>{CROWDS[i]!.name}</td>
              <td class="num you">{r.you}{r.result.youWon ? ' (won)' : ''}</td>
              <td>{depthName(depthOf(r.you))}</td>
              <td class="num">{one(r.result.average)}</td>
              <td class="num">{one(r.result.target)}</td>
              <td class="num">{r.result.winning.join(', ')}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p>
      You won {won} of {ROUNDS} rounds. “Steps ahead” is the step your number was nearest. Someone who thinks no steps ahead picks at random, about 50 on average.
      One step expects that, and picks two-thirds of 50: about 33. Two steps picks two-thirds of that, about 22, and so on.
    </p>

    <h3>The “rational” answer</h3>
    <p data-testid="tt-chain">
      Even if everyone picked 100, two-thirds of the average would be {Math.round(chain(1)[1]!)}. So no one should pick more than that. If no one does, no one
      should pick more than {chain(5)
        .slice(2)
        .map((n) => Math.round(n))
        .join(', then ')}, and so on, all the way down to 0. Game theory calls 0 the equilibrium. But 0 wins only if everyone else reasons all the way too.
    </p>

    <h3>Each depth, in your four rounds</h3>
    <p>How far each way of thinking would have been from the target, had you picked its number. In bold: it would have won.</p>
    <div class="lab-scroll">
      <table class="lab-table" data-testid="tt-depths">
        <thead>
          <tr>
            <th>Thinking</th>
            {#each rounds.keys() as i (i)}<th class="num">Round {i + 1}</th>{/each}
            <th class="num">On average</th>
          </tr>
        </thead>
        <tbody>
          {#each DEPTHS as k (k)}
            <tr>
              <td>{depthText(k)}</td>
              {#each rounds as r, i (i)}
                {@const d = replay(r.bots, depthGuess(k))}
                <td class="num" class:you={d.won}>{one(d.distance)}</td>
              {/each}
              <td class="num">{one(summary.distance[at(k)]!)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p data-testid="tt-best">
      In your rounds, {depthText(summary.best)} was closest on average: {one(summary.distance[at(summary.best)]!)} away. No steps was {one(
        summary.distance[at(0)]!,
      )}
      away, and all the way to 0 was {one(summary.distance[at(Infinity)]!)} away.
    </p>

    <h3>Over {REPLAYS.toLocaleString('en-IN')} replays of each crowd</h3>
    <div class="lab-scroll">
      <table class="lab-table" data-testid="tt-replays">
        <thead><tr><th>Crowd</th><th>Best on average</th><th class="num">No steps (50)</th><th class="num">All the way (0)</th></tr></thead>
        <tbody>
          {#each sim as s, i (s.crowd)}
            <tr>
              <td>{CROWDS[i]!.name}</td>
              <td>{depthText(s.best)}, {one(s.distance[at(s.best)]!)} away</td>
              <td class="num">{one(s.distance[at(0)]!)} away</td>
              <td class="num">{one(s.distance[at(Infinity)]!)} away</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <h3>What it shows</h3>
    <ul class="lab-lesson">
      <li>
        Logic alone says 0. But winning does not depend on logic alone: it depends on how far the others think. In every crowd here, neither no steps nor all
        the way was ever the best guess. One or two steps beat both against first-timers, and a step more against a crowd that had played before or knew the
        theory.
      </li>
      <li>
        People who play again think a step further, because they expect the others to. Rosemarie Nagel (1995) found this with real players: the average fell
        round after round.
      </li>
      <li>
        John Maynard Keynes (1936, chapter 12) said investing is like a newspaper contest to pick the faces others will pick as prettiest. You win by guessing
        what others will think, and what they think others will think.
      </li>
      <li>
        Off the game: when your result depends on what many others choose, such as a price against rivals, the day to sell or which queue to join, guess how far
        ahead most of them think. Then go one step further, not all the way.
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
  .guess {
    display: grid;
    gap: 6px;
  }
  .guess label {
    font-weight: 600;
  }
  .line {
    width: 100%;
    max-width: 40rem;
    height: auto;
  }
  .line text {
    fill: var(--ink-2);
    font: 11px var(--sans);
  }
  .line .axis {
    stroke: var(--rule-strong);
    stroke-width: 1.5;
  }
  .line .target {
    stroke: var(--pass);
    stroke-width: 2;
  }
  .line .target-label {
    fill: var(--pass);
    font-weight: 600;
  }
  .line .bot {
    fill: var(--ink-2);
  }
  .line .you {
    fill: var(--ink);
  }
</style>
