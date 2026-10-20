<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { botTake, drawPiles, GAMES, review, starter, TAKES, type Player, type Review } from '../../lib/labs/nim';

  /** Nim against a bot that plays perfectly when it can: five games, a look back after each, then a debrief. */
  interface Move {
    who: Player;
    take: number;
    left: number;
  }
  interface Game {
    pile: number;
    first: Player;
    winner: Player;
    reviews: Review[];
  }

  const WINNING = [4, 8, 12, 16, 20];
  const NAME: Record<Player, string> = { you: 'You', bot: 'Bot' };

  let piles = $state<number[]>([]);
  let games = $state<Game[]>([]);
  /** Take turns from this game on, you first; unset while the learner chooses each game. */
  let alternateFrom = $state<number>();
  let first = $state<Player>();
  let pile = $state(0);
  let moves = $state<Move[]>([]);
  let over = $state(false);
  let status = $state('');
  let debrief = $state(false);
  let actionsEl = $state<HTMLElement>();
  let statusEl = $state<HTMLElement>();
  let debriefEl = $state<HTMLElement>();

  const index = $derived(games.length);
  const start = $derived(piles[index] ?? 0);
  const playing = $derived(first !== undefined && !over);
  /** The game on show: the one just finished while looking back, else the next. */
  const shown = $derived(over ? index : Math.min(index + 1, GAMES));
  /** Counters drawn: the whole pile the game started with, taken ones hollow. */
  const last = $derived(games.at(-1));
  const slots = $derived(over ? (last?.pile ?? 0) : start);
  const wins = $derived(games.filter((g) => g.winner === 'you').length);
  const yourMoves = $derived(games.flatMap((g) => g.reviews));
  const counters = (n: number) => (n === 1 ? '1 counter' : `${n} counters`);

  onMount(() => {
    piles = drawPiles(Math.random);
    status = `Game 1: the pile has ${counters(piles[0]!)}. Who goes first?`;
  });

  function take(who: Player, n: number) {
    pile -= n;
    moves.push({ who, take: n, left: pile });
    return `${who === 'you' ? 'You' : 'The bot'} took ${n}, leaving ${pile}.`;
  }

  async function finish(winner: Player) {
    over = true;
    const reviews = moves.reduce<Review[]>((rs, m, i) => {
      if (m.who === 'you') rs.push(review(i ? moves[i - 1]!.left : start, m.take));
      return rs;
    }, []);
    games.push({ pile: start, first: first!, winner, reviews });
    status = `${status} ${winner === 'you' ? 'You took the last counter: you win' : 'The bot took the last counter: it wins'} game ${games.length}.`;
    await tick();
    statusEl?.focus();
  }

  async function begin(who: Player) {
    [first, pile, moves, over] = [who, start, [], false];
    status = `Game ${index + 1}: ${counters(pile)}.`;
    if (who === 'bot') status = `${status} ${take('bot', botTake(pile))}`;
    status = `${status} Your turn.`;
    await focusActions();
  }

  async function focusActions() {
    await tick();
    actionsEl?.querySelector('button')?.focus();
  }

  async function play(n: number) {
    if (!playing || n > pile) return;
    status = take('you', n);
    if (pile === 0) return finish('you');
    status = `${status} ${take('bot', botTake(pile))}`;
    if (pile === 0) return finish('bot');
    status = `${status} Your turn.`;
  }

  async function next() {
    first = undefined;
    over = false;
    if (alternateFrom !== undefined) return begin(starter('alternate', index - alternateFrom));
    status = `Game ${index + 1}: the pile has ${counters(start)}. Who goes first?`;
    await focusActions();
  }

  function alternate() {
    alternateFrom = index;
    begin('you');
  }

  async function showDebrief() {
    debrief = true;
    await tick();
    debriefEl?.focus();
  }

  function again() {
    [piles, games, alternateFrom, first, over, debrief] = [drawPiles(Math.random), [], undefined, undefined, false, false];
    next();
  }

  const said = (r: Review) =>
    r.good
      ? `From ${r.before} you took ${r.take}, leaving ${r.left}: a multiple of 4.`
      : r.best
        ? `From ${r.before} you took ${r.take}, leaving ${r.left}. Taking ${r.best} would have left ${r.before - r.best}.`
        : `From ${r.before} you took ${r.take}, leaving ${r.left}. No move from ${r.before} leaves a multiple of 4.`;
</script>

<div class="lab card">
  <div class="lab-stage">
    <dl class="lab-score">
      <div>
        <dt>Game</dt>
        <dd data-testid="nim-game">{shown} <span class="of">of {GAMES}</span></dd>
      </div>
      <div>
        <dt>Counters left</dt>
        <dd data-testid="nim-pile">{first ? pile : start || ''}</dd>
      </div>
      <div>
        <dt>You won</dt>
        <dd data-testid="nim-you">{wins}</dd>
      </div>
      <div>
        <dt>Bot won</dt>
        <dd>{games.length - wins}</dd>
      </div>
    </dl>
    <div class="pile" aria-hidden="true">
      {#each { length: slots }, i}
        <span class="counter" class:gone={first !== undefined && i >= pile}></span>
      {/each}
    </div>
    <p class="lab-status" aria-live="polite" tabindex="-1" bind:this={statusEl} data-testid="nim-status">{status}</p>
    <div class="lab-actions" bind:this={actionsEl}>
      {#if playing}
        {#each TAKES as n (n)}
          <button class="button primary" type="button" disabled={n > pile} onclick={() => play(n)}>Take {n}</button>
        {/each}
      {:else if !first}
        <button class="button primary" type="button" disabled={!start} onclick={() => begin('you')}>You go first</button>
        <button class="button" type="button" disabled={!start} onclick={() => begin('bot')}>Bot goes first</button>
        <button class="button" type="button" disabled={!start} onclick={alternate}>Take turns, you first</button>
      {:else if index < GAMES}
        <button class="button primary" type="button" onclick={next}>Next game</button>
      {:else}
        <button class="button primary" type="button" onclick={showDebrief} disabled={debrief}>See the debrief</button>
      {/if}
    </div>
    <ol class="history" aria-label="Moves this game">
      {#each moves as m, i (i)}
        <li><b>{NAME[m.who]}</b> took {m.take}, {m.left} left</li>
      {/each}
    </ol>
    {#if over && last}
      <div class="look-back" data-testid="nim-review">
        <h3>Looking back</h3>
        <p class="lab-note">Positions to leave the bot: {WINNING.join(', ')}. From any of them, whatever it takes, you can leave the next one.</p>
        <ul class="lab-lesson">
          {#if last.pile % 4 === 0}
            <li>
              The pile started at {last.pile}, a multiple of 4, so the player who goes first loses against perfect play. Here, letting the bot start wins.
            </li>
          {:else}
            <li>The pile started at {last.pile}, not a multiple of 4, so going first wins: take {last.pile % 4} to leave {last.pile - (last.pile % 4)}.</li>
          {/if}
          {#each last.reviews as r, i (i)}
            <li class:good={r.good}>{said(r)}</li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>
</div>

{#if debrief}
  <section class="lab-debrief" data-testid="nim-debrief">
    <h2 tabindex="-1" bind:this={debriefEl}>Debrief</h2>
    <div class="lab-scroll">
      <table class="lab-table">
        <thead>
          <tr><th>Game</th><th class="num">Pile</th><th>First</th><th>Winner</th><th class="num">Your moves that left a multiple of 4</th></tr>
        </thead>
        <tbody>
          {#each games as g, i (i)}
            <tr>
              <td>{i + 1}</td>
              <td class="num">{g.pile}</td>
              <td>{NAME[g.first]}</td>
              <td class:you={g.winner === 'you'}>{NAME[g.winner]}</td>
              <td class="num">{g.reviews.filter((r) => r.good).length} of {g.reviews.length}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p>
      You won {wins} of {GAMES}. Of your {yourMoves.length} moves, {yourMoves.filter((r) => r.good).length} left a multiple of 4. The bot wins whenever you leave
      anything else.
    </p>
    <h3>What it shows</h3>
    <ul class="lab-lesson">
      <li>
        Work backwards from the goal. With 0 left, the player who just moved has won. So facing 1, 2 or 3 you win by taking them all, and facing 4 you lose,
        since any take leaves 1 to 3. Facing 5, 6 or 7 you win by leaving 4, and so on: every multiple of 4 is a loss for the player to move.
      </li>
      <li>The whole game comes down to one rule, leave a multiple of 4, and you find it by starting from the end, not the beginning.</li>
      <li>It also tells you whether to go first: from a multiple of 4, let the other side start.</li>
      <li>
        This is backward induction, the way game theory solves any game with a known end: settle the last decision first, then the one before it, back to the
        move you make now.
      </li>
      <li>
        In work, find the end state you need and the step just before it, then the one before that, until you reach today. It works when the end is known and
        others look ahead too; where they do not, plan in stages and look again.
      </li>
    </ul>
    <button class="button" type="button" onclick={again}>Play again</button>
  </section>
{/if}

<style>
  .lab-stage {
    min-height: 22rem;
  }
  .of {
    font-size: 0.9rem;
    font-weight: 400;
    color: var(--ink-2);
  }
  .pile {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    min-height: calc(3 * 20px + 2 * 6px);
    align-content: flex-start;
  }
  .counter {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--ink);
    border: 2px solid var(--ink);
    box-sizing: border-box;
  }
  .counter.gone {
    background: transparent;
    border-color: var(--rule);
  }
  .lab-actions .button {
    min-width: 6.5em;
    justify-content: center;
  }
  .history {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 16px;
    min-height: 3em;
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--ink-2);
    font-size: 0.9rem;
  }
  .history b {
    color: var(--ink);
  }
  .look-back h3 {
    margin: 8px 0 4px;
  }
  .look-back .good {
    color: var(--pass);
  }
</style>
