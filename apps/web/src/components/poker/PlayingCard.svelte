<script lang="ts">
  import { cardName, rankOf, suitOf, type Card } from '@chaalwise/poker/cards';

  /** One playing card, face up, or face down when it is not ours to see. */
  let { card }: { card?: Card | undefined } = $props();

  // The text-style selector (U+FE0E) stops systems drawing the suits as emoji, which ignore the card's colour.
  const SYMBOL = { s: '♠\uFE0E', h: '♥\uFE0E', d: '♦\uFE0E', c: '♣\uFE0E' } as const;
  const RANK = { T: '10' } as Record<string, string>;
</script>

{#if card}
  <span class="playing-card" class:red={suitOf(card) === 'h' || suitOf(card) === 'd'} role="img" aria-label={cardName(card)}>
    <span class="rank">{RANK[rankOf(card)] ?? rankOf(card)}</span><span class="suit">{SYMBOL[suitOf(card)]}</span>
  </span>
{:else}
  <span class="playing-card back" role="img" aria-label="Face-down card"></span>
{/if}

<!-- Styles are in poker.css: drawn only after the page loads, its scoped styles would not reach the page. -->
