<script lang="ts">
  import type { Table } from '@chaalwise/poker/table';
  import { pointsWord } from '../../lib/poker/words';
  import PlayingCard from './PlayingCard.svelte';

  /** A heads-up table as it stands: the bot's cards (face down until a showdown), the shared cards and pot, and yours. */
  let { table, you, bot }: { table: Table; you: number; bot: number } = $props();
</script>

<div class="poker-row" aria-label="The bot's cards">
  <span class="who">Bot · {table.seats[bot]!.points} points</span>
  {#each table.seats[bot]!.cards as card (card)}<PlayingCard card={table.result && !table.result.byFold ? card : undefined} />{/each}
</div>
<div class="poker-row" aria-label="Shared cards">
  {#each [0, 1, 2, 3, 4] as i (i)}{#if table.board[i]}<PlayingCard card={table.board[i]} />{:else}<span class="slot"></span>{/if}{/each}
  <span class="pot">Pot: {pointsWord(table.pot || (table.result?.won ?? 0))}</span>
</div>
<div class="poker-row" aria-label="Your cards">
  <span class="who">You · {table.seats[you]!.points} points</span>
  {#each table.seats[you]!.cards as card (card)}<PlayingCard {card} />{/each}
</div>
