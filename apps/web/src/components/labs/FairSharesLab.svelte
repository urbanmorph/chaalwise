<script lang="ts">
  import { markMet } from '../../lib/meet';
  import { tick } from 'svelte';
  import {
    addedIn,
    ALL,
    coreRanges,
    equalSplit,
    GAMES,
    inCore,
    members,
    objections,
    ORDERS,
    shapley,
    TRIES,
    worth,
    type Objection,
    type SplitGame,
  } from '../../lib/labs/fair-shares';

  /**
   * Fair shares: propose splits for a fest food stall and a shared cab; three
   * bots object if they would do better on their own. After each game, the core
   * and the Shapley split, worked out step by step. Then a debrief.
   */

  type Phase = 'intro' | 'play' | 'done';

  let phase = $state<Phase>('intro');
  /** Each game's proposals so far. */
  let tries = $state<number[][][]>([]);
  let amounts = $state<(number | undefined)[]>([undefined, undefined, undefined]);
  let debrief = $state(false);
  let headEl = $state<HTMLElement>();
  let statusEl = $state<HTMLElement>();
  let debriefEl = $state<HTMLElement>();

  const at = $derived(Math.max(tries.length - 1, 0));
  const game = $derived(GAMES[at]!);
  const mine = $derived(tries[at] ?? []);
  const last = $derived(mine.at(-1));
  /** The game is over: a split everyone accepts, or no tries left. */
  const settled = $derived(!!last && (inCore(game, last) || mine.length === TRIES));
  const total = $derived(worth(game, ALL));
  const left = $derived(total - amounts.reduce<number>((s, a) => s + (a ?? 0), 0));
  const ready = $derived(amounts.every((a) => typeof a === 'number' && a >= 0 && Number.isInteger(a)) && left === 0);
  const accepted = $derived(tries.filter((t, i) => t.length && inCore(GAMES[i]!, t.at(-1)!)).length);

  const names = (g: SplitGame, who: number[]) => who.map((i) => g.players[i]!.name).join(' and ');
  /** Why a person or pair objects, in a sentence. */
  const objectionText = (g: SplitGame, o: Objection) =>
    `${names(g, o.who)} ${o.who.length === 1 ? 'objects' : 'object'}: ` +
    (g.kind === 'value'
      ? `on their own they would make ${o.own}, more than the ${o.given} your split gives them.`
      : `a cab of their own would cost ${o.own}, less than the ${o.given} your split asks of them.`);
  const share = (g: SplitGame) => (g.kind === 'value' ? 'gets' : 'pays');
  /** Each group but the whole, alone first, then pairs. */
  const GROUPS = [1, 2, 4, 3, 5, 6];

  async function focus(el: () => HTMLElement | undefined) {
    await tick();
    el()?.focus();
  }

  function start() {
    [tries, amounts, debrief, phase] = [[[]], [undefined, undefined, undefined], false, 'play'];
    focus(() => headEl);
  }

  function propose(event: SubmitEvent) {
    event.preventDefault();
    if (!ready || settled) return;
    tries[at]!.push(amounts.map((a) => a!));
    // Played to the end: the lab is met, its questions open up in practice, and the progress page shows when.
    if (at === GAMES.length - 1 && settled) {
      phase = 'done';
      markMet('labs/fair-shares');
    }
    focus(() => statusEl);
  }

  function next() {
    tries.push([]);
    amounts = [undefined, undefined, undefined];
    focus(() => headEl);
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
        Two groups of three make something together that none of them could make as well alone: a food stall at a college fest, then a shared cab home. You
        propose how to split it.
      </p>
      <p>
        Each bot accepts, or objects if it would do better on its own or with just one of the others. You have {TRIES} tries for each. Then you see the splits nobody
        would object to, and the split by what each person adds, worked out step by step.
      </p>
      <p class="lab-note">Points only; nothing to win or buy. A few minutes in all.</p>
      <div class="lab-actions">
        <button class="button primary" type="button" onclick={start}>Start</button>
      </div>
    {:else}
      <dl class="lab-score">
        <div>
          <dt>Round</dt>
          <dd data-testid="fair-round">{at + 1} <span class="of">of {GAMES.length}</span></dd>
        </div>
        <div>
          <dt>Tries</dt>
          <dd data-testid="fair-tries">{mine.length} <span class="of">of {TRIES}</span></dd>
        </div>
        <div>
          <dt>Splits accepted</dt>
          <dd data-testid="fair-accepted">{accepted}</dd>
        </div>
      </dl>
      <h2 tabindex="-1" bind:this={headEl} data-testid="fair-head">{game.title}</h2>
      <p class="setting">{game.about}</p>
      <ul class="people">
        {#each game.players as p (p.name)}<li><strong>{p.name}</strong> {p.role}.</li>{/each}
      </ul>
      <div class="lab-scroll">
        <table class="lab-table">
          <thead><tr><th>Who</th><th class="num">{game.kind === 'value' ? 'Points they make' : 'Their fare'}</th></tr></thead>
          <tbody>
            {#each GROUPS as s (s)}
              <tr><td>{names(game, members(s))}{members(s).length === 1 ? ' alone' : ''}</td><td class="num">{worth(game, s)}</td></tr>
            {/each}
            <tr class="you"><td>All three</td><td class="num">{total}</td></tr>
          </tbody>
        </table>
      </div>
      {#if game.claim}
        <p class="says">{game.players[game.claim.who]!.name} says: “{game.claim.says}”</p>
      {/if}
      {#if !settled}
        <form class="split" onsubmit={propose}>
          <fieldset class="step">
            <legend>Your split of {total} points: what each {share(game)}</legend>
            <div class="inputs">
              {#each game.players as p, i (p.name)}
                <label>
                  <span>{p.name}</span>
                  <input class="lab-number" type="number" inputmode="numeric" min="0" max={total} step="1" required bind:value={amounts[i]} />
                </label>
              {/each}
            </div>
          </fieldset>
          <p class="lab-note" data-testid="fair-left">{left === 0 ? 'All shared out.' : left > 0 ? `${left} left to share.` : `${-left} too many.`}</p>
          <div class="lab-actions">
            <button class="button primary" type="submit" disabled={!ready}>Propose this split</button>
          </div>
        </form>
      {/if}
      {#if last}
        {@const objected = objections(game, last)}
        <div class="lab-status" tabindex="-1" bind:this={statusEl} aria-live="polite" data-testid="fair-status">
          <p>Try {mine.length}: {last.map((x, i) => `${game.players[i]!.name} ${x}`).join(', ')}.</p>
          {#if objected.length === 0}
            <p>All three accept: nobody would do better on their own.</p>
          {:else}
            {#each objected as o (o.who.join())}<p>{objectionText(game, o)}</p>{/each}
          {/if}
        </div>
      {/if}
      {#if settled}
        {@const ranges = coreRanges(game)}
        {@const fair = shapley(game)}
        <h3>The splits nobody would leave (the core)</h3>
        <p data-testid="fair-core">
          Nobody objects when each person {share(game)} within their range: {game.players
            .map((p, i) => `${p.name} ${ranges[i]![0]} to ${ranges[i]![1]}`)
            .join(', ')}, and the whole {total} is shared out.
        </p>
        <h3>The split by what each adds (the Shapley value)</h3>
        <p>
          Imagine the three joining one at a time. Each adds the difference they make to {game.kind === 'value' ? 'what the group makes' : 'the fare'} when they join.
          Take every order, and average.
        </p>
        <div class="lab-scroll">
          <table class="lab-table" data-testid="fair-shapley">
            <thead>
              <tr
                ><th>Order of joining</th>{#each game.players as p (p.name)}<th class="num">{p.name} adds</th>{/each}</tr
              >
            </thead>
            <tbody>
              {#each ORDERS as order (order.join())}
                {@const added = addedIn(game, order)}
                <tr
                  ><td>{order.map((i) => game.players[i]!.name).join(', ')}</td>{#each added as a, i (i)}<td class="num">{a}</td>{/each}</tr
                >
              {/each}
              <tr class="you">
                <td>Average (total ÷ {ORDERS.length})</td>
                {#each fair as x, i (i)}<td class="num">{x}</td>{/each}
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          The Shapley split: {fair.map((x, i) => `${game.players[i]!.name} ${x}`).join(', ')}. {inCore(game, fair)
            ? 'It lies in the core: nobody would do better on their own.'
            : 'Here it lies outside the core.'}
        </p>
        <div class="lab-actions">
          {#if phase !== 'done'}
            <button class="button primary" type="button" onclick={next}>Next: {GAMES[at + 1]!.title.replace(/^The /, 'the ')}</button>
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
  {@const [stall, cab] = GAMES as [SplitGame, SplitGame]}
  {@const claim = stall.claim!}
  {@const claimer = stall.players[claim.who]!.name}
  <section class="lab-debrief" data-testid="fair-debrief">
    <h2 tabindex="-1" bind:this={debriefEl}>Debrief</h2>
    {#each GAMES as g, gi (g.id)}
      {@const ranges = coreRanges(g)}
      {@const fair = shapley(g)}
      {@const yours = tries[gi]!.at(-1)!}
      <h3>{g.title}</h3>
      <div class="lab-scroll">
        <table class="lab-table">
          <thead><tr><th>Person</th><th class="num">Your last split</th><th class="num">Core range</th><th class="num">Shapley</th></tr></thead>
          <tbody>
            {#each g.players as p, i (p.name)}
              <tr><td>{p.name}</td><td class="num you">{yours[i]}</td><td class="num">{ranges[i]![0]} to {ranges[i]![1]}</td><td class="num">{fair[i]}</td></tr>
            {/each}
          </tbody>
        </table>
      </div>
      <p>
        {inCore(g, yours)
          ? 'Your last split was in the core: nobody would leave.'
          : 'Your last split was outside the core: someone would do better on their own.'}
      </p>
    {/each}
    <p data-testid="fair-summary">
      An equal split, {equalSplit(stall)[0]} each, draws objections in both. At the stall, {objectionText(stall, objections(stall, equalSplit(stall))[0]!)} In the
      cab, {objectionText(cab, objections(cab, equalSplit(cab))[0]!)}
      {claimer} asked for {claim.points}. The core allows it, since {claimer}’s range is {coreRanges(stall)[claim.who]![0]} to {coreRanges(stall)[
        claim.who
      ]![1]}, but on average {claimer} adds {shapley(stall)[claim.who]}, {claim.points - shapley(stall)[claim.who]!} less. The Shapley split is in the core in {GAMES.filter(
        (g) => inCore(g, shapley(g)),
      ).length === GAMES.length
        ? 'both games'
        : 'only some games'}.
    </p>
    <h3>What it shows</h3>
    <ul class="lab-lesson">
      <li>
        Check first that no one, and no pair, would do better on their own. A split that fails this test will not last: the people it shortchanges have a reason
        to leave.
      </li>
      <li>
        That test often leaves many splits standing. To pick one, split by what each person adds, on average, over every order in which the group could have
        come together.
      </li>
      <li>
        An equal split ignores what each person adds. A split by bargaining power, such as “you need me, so I want half”, rewards who holds what others need,
        not what they add.
      </li>
      <li>In a shared cab, that means each stretch of road is paid for equally by everyone who rides it.</li>
    </ul>
  </section>
{/if}

<style>
  .lab-stage {
    min-height: 40rem;
  }
  h2,
  .lab-stage h3 {
    margin: 0;
  }
  .setting,
  .says {
    margin: 0;
  }
  .says {
    font-weight: 600;
  }
  .people {
    margin: 0;
    padding-left: 1.2em;
  }
  .inputs {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .inputs label {
    display: grid;
    gap: 4px;
  }
  .inputs .lab-number {
    width: 5em;
  }
  .split .lab-note {
    margin: 6px 0 10px;
  }
  .lab-status p {
    margin: 0 0 4px;
  }
</style>
