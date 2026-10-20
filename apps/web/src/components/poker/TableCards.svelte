<script lang="ts">
  import type { Card } from '@chaalwise/poker/cards';
  import { pointsWord } from '../../lib/poker/words';
  import type { StepCards } from '../../lib/poker/step-cards';
  import PlayingCard from './PlayingCard.svelte';

  /** A poker step's cards, laid out as at the table: others' hands, the shared cards and the pot, then yours. */
  let { cards }: { cards: StepCards } = $props();
  const board = $derived((cards.board ?? []) as Card[]);
</script>

<div class="table-cards" data-testid="table-cards">
  {#each cards.others ?? [] as other (other.name)}
    <div class="poker-row" aria-label="{other.name}'s cards">
      <span class="who">{other.name}</span>
      {#each other.cards as card (card)}<PlayingCard card={card as Card} />{/each}
    </div>
  {/each}
  {#if cards.board || cards.pot !== undefined}
    <div class="poker-row" aria-label="Shared cards">
      <span class="who">Shared cards</span>
      {#if cards.board}
        {#each [0, 1, 2, 3, 4] as i (i)}{#if board[i]}<PlayingCard card={board[i]} />{:else}<span class="slot"></span>{/if}{/each}
      {/if}
      {#if cards.pot !== undefined}<span class="pot"
          >Pot: {pointsWord(cards.pot)}{#if cards.toCall}, {pointsWord(cards.toCall)} to call{/if}</span
        >{/if}
    </div>
  {/if}
  {#if cards.hole}
    <div class="poker-row" aria-label="Your cards">
      <span class="who">You</span>
      {#each cards.hole as card (card)}<PlayingCard card={card as Card} />{/each}
    </div>
  {/if}
</div>

<!-- Styles are in poker.css: drawn only after the page loads, its scoped styles would not reach the page. -->
