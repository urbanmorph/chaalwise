<script lang="ts">
  import { markMet } from '../../lib/meet';
  import { tick } from 'svelte';
  import { describePattern, outcome, PatternBot, THROWS, type Outcome, type Throw } from '../../lib/labs/rock-paper-scissors';

  /** Rock-paper-scissors against a bot that learns your habits: 30 throws, then a debrief. */
  const ROUNDS = 30;
  /** How many recent rounds the strip shows, so it never grows. */
  const RECENT = 10;

  interface Played {
    you: Throw;
    bot: Throw;
    result: Outcome;
    /** The bot read you right: it guessed this throw. */
    read: boolean;
  }

  let bot = new PatternBot();
  let rounds = $state<Played[]>([]);
  let status = $state('Choose your first throw.');
  let debriefEl = $state<HTMLElement>();
  let actionsEl = $state<HTMLElement>();

  const count = (r: Outcome) => rounds.filter((p) => p.result === r).length;
  const done = $derived(rounds.length >= ROUNDS);
  const recent = $derived(rounds.slice(-RECENT));
  const name = (t: Throw) => t[0]!.toUpperCase() + t.slice(1);
  const said: Record<Outcome, string> = { win: 'you win', loss: 'the bot wins', draw: 'a draw' };
  const pattern = $derived(describePattern(rounds.map((r) => r.you)));
  const guessed = $derived(rounds.filter((r) => r.read).length);

  async function play(you: Throw) {
    if (done) return;
    const guess = bot.predict();
    const move = bot.play(Math.random);
    bot.see(you);
    const result = outcome(you, move);
    rounds.push({ you, bot: move, result, read: guess === you });
    status = `Round ${rounds.length}: you threw ${you}, the bot threw ${move}: ${said[result]}.`;
    if (!done) return;
    // Played: the lab is met, and its questions open up in practice.
    markMet('labs/rock-paper-scissors');
    await tick();
    debriefEl?.focus();
  }

  async function again() {
    bot = new PatternBot();
    rounds = [];
    status = 'Choose your first throw.';
    await tick();
    actionsEl?.querySelector('button')?.focus();
  }
</script>

<div class="lab card">
  <div class="lab-stage">
    <dl class="lab-score">
      <div>
        <dt>Round</dt>
        <dd data-testid="rps-round">{rounds.length} <span class="of">of {ROUNDS}</span></dd>
      </div>
      <div>
        <dt>You won</dt>
        <dd data-testid="rps-you">{count('win')}</dd>
      </div>
      <div>
        <dt>Bot won</dt>
        <dd>{count('loss')}</dd>
      </div>
      <div>
        <dt>Draws</dt>
        <dd>{count('draw')}</dd>
      </div>
    </dl>
    <div class="lab-actions" bind:this={actionsEl}>
      {#each THROWS as t (t)}
        <button class="button primary" type="button" disabled={done} onclick={() => play(t)}>{name(t)}</button>
      {/each}
    </div>
    <p class="lab-status" aria-live="polite" data-testid="rps-status">{status}</p>
    <div class="lab-scroll">
      <table class="lab-table strip">
        <caption class="lab-note">The last {RECENT} rounds</caption>
        <tbody>
          <tr>
            <th scope="row">You</th>
            {#each recent as r, i (i)}<td class:won={r.result === 'win'}>{name(r.you)}</td>{/each}
          </tr>
          <tr>
            <th scope="row">Bot</th>
            {#each recent as r, i (i)}<td class:won={r.result === 'loss'}>{name(r.bot)}</td>{/each}
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

{#if done}
  <section class="lab-debrief" data-testid="rps-debrief">
    <h2 tabindex="-1" bind:this={debriefEl}>Debrief</h2>
    <p>
      You won {count('win')}, the bot won {count('loss')}, and {count('draw')} were draws. The bot guessed your next throw right {guessed} times out of {ROUNDS};
      guessing blind, it would get about 10.
    </p>
    <h3>How predictable you were</h3>
    <ul class="lab-lesson">
      <li>
        Your favourite throw was {pattern.favourite.throw}, {pattern.favourite.count} times out of {ROUNDS}. A random mix throws each about 10 times.
      </li>
      {#if pattern.pair}
        <li>
          Your most common pair in a row was {pattern.pair.first} then {pattern.pair.then}, {pattern.pair.count} times. With a random mix, any one pair turns up about
          3 times in
          {ROUNDS} throws.
        </li>
      {/if}
    </ul>
    <h3>What it shows</h3>
    <ul class="lab-lesson">
      <li>
        People are poor at being random. We avoid repeats, follow a win with the same throw, and fall into short cycles, and a bot that counts can see it.
      </li>
      <li>
        The bot counts what you threw after each pair of throws and plays what beats your likeliest next one. Any pattern you keep, it learns within a few
        throws.
      </li>
      <li>
        A truly random mix, each throw a third of the time, cannot be exploited: against any opponent, this bot included, it wins a third, loses a third and
        draws a third on average. It cannot win much either; it simply leaves nothing to read.
      </li>
      <li>Mix only where someone gains by reading you. Where people rely on you, such as your team or your customers, being predictable is a strength.</li>
    </ul>
    <button class="button" type="button" onclick={again}>Play again</button>
  </section>
{/if}

<style>
  .lab-stage {
    min-height: 17rem;
  }
  .of {
    font-size: 0.9rem;
    font-weight: 400;
    color: var(--ink-2);
  }
  .lab-actions .button {
    min-width: 7.5em;
    justify-content: center;
  }
  .strip {
    width: auto;
  }
  .strip caption {
    text-align: left;
    caption-side: top;
    font-size: 0.85rem;
  }
  .strip td {
    min-width: 5.5em;
    height: 2.4em;
    color: var(--ink-2);
  }
  .strip td.won {
    color: var(--ink);
    font-weight: 700;
  }
</style>
