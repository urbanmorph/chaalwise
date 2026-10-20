<script lang="ts">
  import { tick } from 'svelte';
  import { BOTS, botMove, botName, lastRound, payoff, type BotId, type Move, type StyleRow } from '../../lib/labs/dilemma';

  /**
   * The Prisoner's Dilemma lab: about ten rounds against one bot at a time,
   * then a debrief. The tables of what each style earns over many rounds are
   * worked out at build time and passed in.
   */
  interface Props {
    styles: StyleRow[];
    noisy: { titForTat: number; forgiving: number };
  }
  let { styles, noisy }: Props = $props();

  interface Played {
    you: Move;
    bot: Move;
  }
  interface Match {
    bot: BotId;
    rounds: number;
    you: number;
    them: number;
  }

  let bot = $state<BotId>();
  let queue = $state<BotId[]>([]);
  let end = 0;
  let rounds = $state<Played[]>([]);
  let over = $state(false);
  let results = $state<Match[]>([]);
  let status = $state('');
  let debrief = $state(false);
  let statusEl = $state<HTMLElement>();
  let cooperateEl = $state<HTMLElement>();
  let debriefEl = $state<HTMLElement>();

  const points = (rs: Played[]) =>
    rs.reduce(
      ([y, t], r) => {
        const [py, pt] = payoff(r.you, r.bot);
        return [y + py, t + pt];
      },
      [0, 0],
    );
  const totals = $derived(points(rounds));
  const verb = (m: Move) => (m === 'C' ? 'cooperated' : 'defected');
  const per = (n: number) => n.toFixed(2);
  const percent = (n: number) => `${Math.round(n * 100)}%`;
  const style = (id: BotId) => BOTS.find((b) => b.id === id)!.style;

  async function start(id: BotId, rest: BotId[] = []) {
    [bot, queue, end, rounds, over] = [id, rest, lastRound(Math.random), [], false];
    status = `Round 1 against ${botName(id)}. Cooperate or defect?`;
    await tick();
    cooperateEl?.focus();
  }

  async function play(you: Move) {
    if (!bot || over) return;
    const move = botMove(
      bot,
      rounds.map((r) => r.you),
      Math.random,
    );
    rounds.push({ you, bot: move });
    const [py, pt] = payoff(you, move);
    const n = rounds.length;
    status = `Round ${n}: you ${verb(you)}, ${botName(bot)} ${verb(move)}. You got ${py}, they got ${pt}.`;
    if (n < end) return;
    over = true;
    const [y, t] = totals;
    results.push({ bot, rounds: n, you: y, them: t });
    status = `${status} That was the last round. Final points: you ${y}, ${botName(bot)} ${t}.`;
    await tick();
    statusEl?.focus();
  }

  async function showDebrief() {
    debrief = true;
    await tick();
    debriefEl?.focus();
  }

  const played = $derived(results.reduce((s, m) => [s[0] + m.you, s[1] + m.rounds], [0, 0]));
</script>

<div class="lab card">
  <div class="lab-stage">
    {#if !bot}
      <h2>Choose a bot</h2>
      <p class="lab-note">Each match lasts about ten rounds. You will not know which round is the last.</p>
      <div class="lab-actions">
        <button
          class="button primary"
          type="button"
          onclick={() =>
            start(
              BOTS[0]!.id,
              BOTS.slice(1).map((b) => b.id),
            )}
        >
          Play all five in turn
        </button>
      </div>
      <ul class="bots">
        {#each BOTS as b (b.id)}
          <li>
            <button class="button" type="button" onclick={() => start(b.id)}>{b.name}</button>
            <span class="lab-note">{b.style}</span>
          </li>
        {/each}
      </ul>
    {:else}
      <h2>Against {botName(bot)}</h2>
      <p class="lab-note">{style(bot)}</p>
      <dl class="lab-score">
        <div>
          <dt>Round</dt>
          <dd data-testid="pd-round">{rounds.length} <span class="of">of about ten</span></dd>
        </div>
        <div>
          <dt>Your points</dt>
          <dd data-testid="pd-you">{totals[0]}</dd>
        </div>
        <div>
          <dt>{botName(bot)}</dt>
          <dd>{totals[1]}</dd>
        </div>
      </dl>
      <div class="lab-actions">
        {#if !over}
          <button class="button primary" type="button" bind:this={cooperateEl} onclick={() => play('C')}>Cooperate</button>
          <button class="button" type="button" onclick={() => play('D')}>Defect</button>
        {:else}
          {#if queue.length}
            <button class="button primary" type="button" onclick={() => start(queue[0]!, queue.slice(1))}>
              Next: {botName(queue[0]!)}
            </button>
          {/if}
          <button class="button" type="button" onclick={() => (bot = undefined)}>Choose a bot</button>
          <button class="button" class:primary={!queue.length} type="button" onclick={showDebrief}>See the debrief</button>
        {/if}
      </div>
      <p class="lab-status" aria-live="polite" tabindex="-1" bind:this={statusEl} data-testid="pd-status">{status}</p>
      <div class="lab-scroll">
        <table class="lab-table moves">
          <caption class="sr-only">Moves so far: C is cooperate, D is defect</caption>
          <tbody>
            <tr>
              <th scope="row">You</th>
              {#each rounds as r, i (i)}<td class={r.you === 'C' ? 'tag-c' : 'tag-d'}>{r.you}</td>{/each}
            </tr>
            <tr>
              <th scope="row">Bot</th>
              {#each rounds as r, i (i)}<td class={r.bot === 'C' ? 'tag-c' : 'tag-d'}>{r.bot}</td>{/each}
            </tr>
          </tbody>
        </table>
      </div>
      <p class="lab-note">Both cooperate: 3 each. You defect on a cooperator: 5 to you, 0 to them. Both defect: 1 each.</p>
    {/if}
  </div>
</div>

{#if debrief}
  <section class="lab-debrief" data-testid="pd-debrief">
    <h2 tabindex="-1" bind:this={debriefEl}>Debrief</h2>
    <h3>Your matches</h3>
    <div class="lab-scroll">
      <table class="lab-table">
        <thead>
          <tr><th>Bot</th><th class="num">Rounds</th><th class="num">You</th><th class="num">Bot</th><th class="num">You per round</th></tr>
        </thead>
        <tbody>
          {#each results as m, i (i)}
            <tr>
              <td>{botName(m.bot)}</td>
              <td class="num">{m.rounds}</td>
              <td class="num you">{m.you}</td>
              <td class="num">{m.them}</td>
              <td class="num">{per(m.you / m.rounds)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p>
      You averaged {per(played[0] / played[1])} points a round. Both cooperating every round gives 3; both defecting gives 1.
    </p>

    <h3>What each style earns over many rounds</h3>
    <p class="lab-note">
      Each bot played 200 matches against every bot, itself included. Then a population starts with equal numbers of each, and every generation each style grows
      in proportion to its points.
    </p>
    <div class="lab-scroll">
      <table class="lab-table">
        <thead>
          <tr><th>Style</th><th class="num">Points per round</th><th class="num">Share after 10 generations</th><th class="num">After 60</th></tr>
        </thead>
        <tbody>
          {#each styles as s (s.id)}
            <tr>
              <td>{s.name}</td>
              <td class="num">{per(s.average)}</td>
              <td class="num">{percent(s.early)}</td>
              <td class="num">{percent(s.share)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <h3>What it shows</h3>
    <ul class="lab-lesson">
      <li>
        In any single round, defecting pays you more whatever the other does: 5 instead of 3 if they cooperate, 1 instead of 0 if they defect. Yet both
        cooperating, 3 each, beats both defecting, 1 each.
      </li>
      <li>
        When the game repeats and nobody knows which round is the last, cooperation pays: what you do now is answered later. That is why you were told only
        "about ten rounds".
      </li>
      <li>
        Always selfish earns the most per round while there are pushovers to feed on, and grows at first. As the styles that do well spread, it runs out of
        people to exploit and dies out.
      </li>
      <li>Tit for tat never beats the player it faces: at best it ties. It does well overall because it gets others to cooperate.</li>
      <li>
        Forgiveness helps when moves can be misread. When 1 move in 20 comes out wrong, two tit-for-tats average {per(noisy.titForTat)} points a round, as one slip
        echoes back and forth; two forgiving players average {per(noisy.forgiving)}.
      </li>
    </ul>
  </section>
{/if}

<style>
  .bots {
    display: grid;
    gap: 8px;
    margin: 4px 0 0;
    padding: 0;
    list-style: none;
  }
  .bots li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 12px;
  }
  .bots .button {
    min-width: 11em;
  }
  .lab-stage {
    min-height: 25rem;
  }
  .of {
    font-size: 0.9rem;
    font-weight: 400;
    color: var(--ink-2);
  }
  .moves {
    width: auto;
    min-height: 4.5em;
  }
  .moves td {
    width: 2em;
    text-align: center;
    font-family: var(--mono);
  }
</style>
