<script lang="ts">
  import { markMet } from '../../lib/meet';
  import { tick } from 'svelte';
  import {
    BAGS,
    bagRounds,
    best,
    chanceRed,
    counts,
    drawPlayers,
    playRound,
    RECORD,
    type BagRound,
    type Colour,
    type Draw,
    type Player,
  } from '../../lib/labs/which-bag';

  /**
   * Which bag? Part 1: eight draws, guess the bag and how sure you are (base
   * rates). Part 2: back a player after one round (regression to the mean).
   * What the top and bottom three score over many games is worked out at
   * build time and passed in.
   */
  interface Props {
    typical: { top: { first: number; second: number }; bottom: { first: number; second: number } };
  }
  let { typical }: Props = $props();

  const SURE = [55, 70, 85, 95];
  const BAG_ROW: Colour[] = [...Array<Colour>(BAGS.red.count).fill('red'), ...Array<Colour>(BAGS.blue.count).fill('blue')];
  const kindName = (c: Colour) => (c === 'red' ? 'mostly red' : 'mostly blue');

  interface Answer {
    round: BagRound;
    kind: Colour;
    sure: number;
  }

  let phase = $state<'intro' | 'bags' | 'players' | 'done'>('intro');
  let rounds = $state<BagRound[]>([]);
  let answers = $state<Answer[]>([]);
  let kind = $state<Colour>();
  let sure = $state<number>();
  let players = $state<Player[]>([]);
  let second = $state<number[]>();
  let pick = $state<number>();
  let revealing = $state(false);
  let debrief = $state(false);
  let headEl = $state<HTMLElement>();
  let statusEl = $state<HTMLElement>();
  let debriefEl = $state<HTMLElement>();

  const round = $derived(rounds[answers.length]);
  const last = $derived(answers.at(-1));
  const right = $derived(answers.filter((a) => a.kind === a.round.bag).length);
  const meanSure = $derived(answers.length ? Math.round(answers.reduce((s, a) => s + a.sure, 0) / answers.length) : 0);
  const expected = $derived(answers.reduce((s, a) => s + Math.max(chanceRed(a.round.draw), 1 - chanceRed(a.round.draw)), 0));
  const percent = (x: number) => Math.round(x * 100);
  const drawText = (d: Draw) =>
    d.red + d.blue === 1 ? `one ${d.red ? 'red' : 'blue'} ball` : d.red === 2 ? 'two red balls' : d.blue === 2 ? 'two blue balls' : 'one red ball and one blue';
  const top = $derived(players.length ? best(players, (p) => p.first) : undefined);
  const steady = $derived(players.length ? best(players, (p) => p.form) : undefined);
  const order = $derived(players.map((p, i) => ({ ...p, i })).sort((a, b) => b.first - a.first));
  const group = (rows: { i: number; first: number }[]) => ({
    first: Math.round(rows.reduce((s, r) => s + r.first, 0) / rows.length),
    second: Math.round(rows.reduce((s, r) => s + second![r.i]!, 0) / rows.length),
  });
  const signed = (x: number) => (x > 0 ? `+${x}` : `${x}`);

  /** Focus an element once it is drawn. */
  async function focus(el: () => HTMLElement | undefined) {
    await tick();
    el()?.focus();
  }

  function start() {
    [rounds, answers, phase, revealing] = [bagRounds(Math.random), [], 'bags', false];
    focus(() => headEl);
  }

  function answer(event: SubmitEvent) {
    event.preventDefault();
    if (!round || revealing || !kind || !sure) return;
    answers.push({ round, kind, sure });
    revealing = true;
    focus(() => statusEl);
  }

  function next() {
    [kind, sure, revealing] = [undefined, undefined, false];
    if (answers.length < rounds.length) focus(() => headEl);
    else {
      [players, second, pick, phase] = [drawPlayers(Math.random), undefined, undefined, 'players'];
      focus(() => headEl);
    }
  }

  function back(i: number) {
    if (second) return;
    pick = i;
    second = playRound(players, Math.random);
    phase = 'done';
    // Played to the end: the lab is met, its questions open up in practice, and the progress page shows when.
    markMet('labs/which-bag');
    focus(() => statusEl);
  }

  async function showDebrief() {
    debrief = true;
    await focus(() => debriefEl);
  }
</script>

{#snippet balls(list: Colour[])}
  <span class="balls" aria-hidden="true"
    >{#each list as c, i (i)}<span class="ball {c}"></span>{/each}</span
  >
{/snippet}

{#snippet bagsRow()}
  <div class="bags" role="img" aria-label="8 mostly-red bags and 2 mostly-blue bags">
    {#each BAG_ROW as c, i (i)}<span class="bag {c}"></span>{/each}
  </div>
{/snippet}

<div class="lab card">
  <div class="lab-stage">
    {#if phase === 'intro'}
      <h2>Part 1: which bag?</h2>
      {@render bagsRow()}
      <p>
        There are {BAGS.red.count + BAGS.blue.count} bags, each with 10 balls. {BAGS.red.count} bags hold mostly red balls ({BAGS.red.reds} red, {BAGS.red
          .blues} blue).
        {BAGS.blue.count} bags hold mostly blue balls ({BAGS.blue.reds} red, {BAGS.blue.blues} blue).
      </p>
      <p>
        Each round, one bag is picked at random where you can't see it. One or two balls are drawn from it, and each ball goes back before the next is drawn.
        Say which kind of bag the balls came from, and how sure you are. Then you see which bag it really was. There are eight rounds.
      </p>
      <p>The point: a clue can mislead you if you forget how common each kind of bag is.</p>
      <p class="lab-note">
        Then part 2: ten players each play one round, where scores are part skill and part luck. You pick one player to back in the next round.
      </p>
      <div class="lab-actions">
        <button class="button primary" type="button" onclick={start}>Start part 1</button>
      </div>
    {:else if phase === 'bags'}
      <h2 tabindex="-1" bind:this={headEl} data-testid="bag-round">Round {answers.length + (revealing ? 0 : 1)} of {rounds.length}</h2>
      {@render bagsRow()}
      <p class="lab-note">
        {BAGS.red.count} mostly-red bags ({BAGS.red.reds} red, {BAGS.red.blues} blue). {BAGS.blue.count} mostly-blue bags ({BAGS.blue.reds} red, {BAGS.blue
          .blues} blue).
      </p>
      {@const shown = revealing ? last!.round : round!}
      <p class="drawn">Drawn: {@render balls(shown.balls)} <span data-testid="bag-draw">{shown.balls.join(', then ')}</span></p>
      {#if !revealing}
        <form class="guess" onsubmit={answer}>
          <fieldset>
            <legend>Which kind of bag was it?</legend>
            <div class="choices">
              {#each ['red', 'blue'] as const as c (c)}
                <label><input type="radio" name="kind" value={c} bind:group={kind} />{kindName(c)}</label>
              {/each}
            </div>
          </fieldset>
          <fieldset>
            <legend>How sure are you?</legend>
            <div class="choices">
              {#each SURE as s (s)}
                <label><input type="radio" name="sure" value={s} bind:group={sure} />{s}%</label>
              {/each}
            </div>
          </fieldset>
          <div class="lab-actions">
            <button class="button primary" type="submit" disabled={!kind || !sure}>Answer</button>
          </div>
        </form>
      {:else}
        {@const a = last!}
        {@const c = counts(a.round.draw)}
        <p class="lab-status" tabindex="-1" bind:this={statusEl} aria-live="polite" data-testid="bag-result">
          It was a {a.round.bag === 'red' ? 'mostly-red' : 'mostly-blue'} bag. You said {kindName(a.kind)}, {a.sure}% sure. The chance it was mostly red, given {drawText(
            a.round.draw,
          )}, was {percent(chanceRed(a.round.draw))}
          in 100.
        </p>
        <p class="lab-note">
          Why: picture {c.picks} random picks of a bag. A mostly-red bag gives this draw {c.red} times, and a mostly-blue bag gives it {c.blue} times. So this draw
          means a mostly-red bag {c.red} times in {c.red + c.blue}.
        </p>
        <div class="lab-actions">
          <button class="button primary" type="button" onclick={next}>{answers.length < rounds.length ? 'Next round' : 'On to part 2'}</button>
        </div>
      {/if}
    {:else}
      <h2 tabindex="-1" bind:this={headEl}>Part 2: back a player</h2>
      <p>
        Ten players have just played round one. Each score is part skill and part luck. The table shows each player's average over their last {RECORD} games, and
        their round-one score. Back one player: press Back next to the one you think will score highest in round two.
      </p>
      <div class="lab-scroll">
        <table class="lab-table">
          <thead>
            <tr
              ><th>Player</th><th class="num">Last {RECORD} games</th><th class="num">Round one</th><th class="num">Round two</th><th class="num">Change</th><th
                ><span class="sr-only">Back</span></th
              ></tr
            >
          </thead>
          <tbody>
            {#each players as p, i (p.name)}
              <tr class:you={pick === i}>
                <td>{p.name}</td>
                <td class="num">{p.form}</td>
                <td class="num">{p.first}</td>
                <td class="num">{second ? second[i] : ''}</td>
                <td class="num">{second ? signed(second[i]! - p.first) : ''}</td>
                <td>
                  {#if !second}
                    <button class="button small" type="button" onclick={() => back(i)} aria-label={`Back ${p.name}`}>Back</button>
                  {:else if pick === i}
                    Your pick
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <p class="lab-status" tabindex="-1" bind:this={statusEl} aria-live="polite" data-testid="bag-players">
        {#if second && pick !== undefined && top}
          {@const t = group(order.slice(0, 3))}
          {@const b = group(order.slice(-3))}
          You backed {players[pick]!.name}, who scored {second[pick]} in round two. The round-one top scorer, {top.name}, went from {top.first} to {second[
            players.indexOf(top)
          ]}. {steady!.name}, with the best record ({steady!.form}), scored {second[players.indexOf(steady!)]}. The top three averaged {t.first} in round one and
          {t.second}
          in round two; the bottom three went from {b.first} to {b.second}.
        {/if}
      </p>
      {#if second}
        <div class="lab-actions">
          <button class="button primary" type="button" onclick={showDebrief} disabled={debrief}>See the debrief</button>
        </div>
      {/if}
    {/if}
  </div>
</div>

{#if debrief}
  <section class="lab-debrief" data-testid="bag-debrief">
    <h2 tabindex="-1" bind:this={debriefEl}>Debrief</h2>
    <h3>Part 1: which bag?</h3>
    <div class="lab-scroll">
      <table class="lab-table">
        <thead><tr><th>Round</th><th>Drawn</th><th>You said</th><th class="num">Chance mostly red</th><th>It was</th></tr></thead>
        <tbody>
          {#each answers as a, i (i)}
            <tr>
              <td>{i + 1}</td>
              <td>{a.round.balls.join(', ')}</td>
              <td class:you={a.kind === a.round.bag}>{kindName(a.kind)}, {a.sure}%</td>
              <td class="num">{percent(chanceRed(a.round.draw))} in 100</td>
              <td>{kindName(a.round.bag)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p>
      You were right {right} times out of {answers.length}, and on average {meanSure}% sure. Always naming the likelier kind of bag, given the counts, would be
      right about {expected.toFixed(1)} times in {answers.length} on average.
    </p>
    <p>
      A single blue ball feels like a mostly-blue bag. But out of 100 picks, a blue ball comes from a mostly-red bag {counts({ red: 0, blue: 1 }).red} times and from
      a mostly-blue bag only {counts({
        red: 0,
        blue: 1,
      }).blue} times. Mostly-red bags are so common that they give more blue balls in all.
    </p>
    <h3>Part 2: back a player</h3>
    <p>
      Over many replays of this game, the round-one top three averaged {Math.round(typical.top.first)} in round one and {Math.round(typical.top.second)} in round
      two. The bottom three went from {Math.round(typical.bottom.first)} to {Math.round(typical.bottom.second)}. Nobody changed: the luck did.
    </p>
    <h3>What it shows</h3>
    <ul class="lab-lesson">
      <li>
        Start from how common something is, the base rate, then adjust for the evidence. A clue that points one way can still leave the common answer the
        likelier one.
      </li>
      <li>Counting helps: picture 100 cases and count how many end each way, rather than trusting how strongly the clue seems to point.</li>
      <li>
        When results mix skill and luck, the top scorers in one round were mostly lucky as well as good. Expect them to fall back towards the average, and the
        bottom scorers to rise, whatever anyone does.
      </li>
      <li>A lucky streak usually ends, so judge on more than one result. A long record says more about skill than one round.</li>
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
  .bags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .bag {
    width: 26px;
    height: 32px;
    border-radius: 6px 6px 10px 10px;
    border: 2px solid var(--rule-strong);
  }
  .bag.red,
  .ball.red {
    background: #d0453a;
  }
  .bag.blue,
  .ball.blue {
    background: #2f6fd6;
  }
  .drawn {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
  }
  .balls {
    display: inline-flex;
    gap: 6px;
  }
  .ball {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid var(--rule-strong);
  }
  fieldset {
    margin: 0 0 12px;
    padding: 0;
    border: 0;
  }
  legend {
    font-weight: 600;
    margin-bottom: 6px;
  }
  .button.small {
    min-height: 36px;
    padding: 4px 14px;
  }
</style>
