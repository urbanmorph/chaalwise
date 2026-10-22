<script lang="ts">
  import { onMount } from 'svelte';
  import { logAttempt } from '../../lib/attempts';
  import { count } from '../../lib/count';
  import { POKER_DRILLS } from '../../lib/drill-list';
  import { finishDaily, readDaily, today, type DailyRecord } from '../../lib/daily';
  import { pokerDailyItem, type PokerItem } from '../../lib/poker/drills';
  import { DRILL_SKILL } from '../../lib/profile-skills';
  import PokerQuestion from './PokerQuestion.svelte';

  /**
   * Today's poker puzzle: one exercise from the poker drills, the same for everyone
   * today, a different kind each day. Answering it keeps the daily streak going.
   */
  let { onfinished }: { onfinished?: (record: DailyRecord) => void } = $props();

  const date = today();
  let item = $state<PokerItem>();
  let given = $state<number>();
  let doneBefore = false;

  // Worked out in the browser after the page shows: some exercises take a moment.
  onMount(() => {
    doneBefore = readDaily().done.poker?.date === date;
    setTimeout(() => (item = pokerDailyItem(date)));
  });

  function answer(value: number) {
    if (!item || given !== undefined) return;
    given = value;
    if (doneBefore) return;
    const right = value === item.answer;
    logAttempt(DRILL_SKILL[`poker-${item.kind}`], right ? 'first-try' : 'missed', 'drill', item.options ? { chance: 1 / item.options.length } : {});
    count('drill:daily-poker');
    onfinished?.(finishDaily('poker', date, right));
    doneBefore = true;
  }
</script>

<PokerQuestion {item} {given} onanswer={answer} focusEach={false}>
  {#snippet after()}
    <p><a href={`/poker/drills/#${POKER_DRILLS.find((d) => d.kind === item!.kind)!.id}`}>Ten more like this in the poker drills</a></p>
  {/snippet}
</PokerQuestion>
