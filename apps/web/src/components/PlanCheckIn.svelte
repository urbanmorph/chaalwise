<script lang="ts">
  import { planToAsk, type CheckInResult, type PlanRecord } from '@chaalwise/core/plans';
  import { openProgress } from '@chaalwise/core/progress';
  import { onMount } from 'svelte';

  /** "Did you use it?" for the oldest plan that is ready to ask about, one at a time. */
  let plan = $state<PlanRecord>();
  let answered = $state<CheckInResult>();

  onMount(async () => {
    try {
      const progress = await openProgress();
      plan = planToAsk(await progress.plans(), new Date());
      progress.close();
    } catch (error) {
      console.error(error);
    }
  });

  const REPLY: Record<CheckInResult, string> = {
    used: 'Good. Was it a good decision, whatever the result? That is the part to judge.',
    forgot: 'That is normal at first. Tie it to something you already do, and it will be asked again in a week.',
    'no-chance': 'It will be asked again in a week.',
  };

  /** The reply shows once the answer is saved, so leaving straight away cannot lose it. */
  async function answer(result: CheckInResult) {
    try {
      const progress = await openProgress();
      await progress.checkInPlan(plan!.id, result, new Date());
      progress.close();
    } catch (error) {
      console.error(error);
    }
    answered = result;
  }
</script>

{#if plan}
  <section class="card check-in" aria-labelledby="check-in-title" data-testid="plan-check-in">
    <h2 id="check-in-title">Did you use it?</h2>
    <p class="plan">Your plan: {plan.text}</p>
    {#if answered}
      <p aria-live="polite">{REPLY[answered]}</p>
    {:else}
      <div class="actions">
        <button class="button" type="button" onclick={() => answer('used')}>I used it</button>
        <button class="button" type="button" onclick={() => answer('forgot')}>I forgot</button>
        <button class="button" type="button" onclick={() => answer('no-chance')}>No chance yet</button>
      </div>
    {/if}
  </section>
{/if}

<style>
  .check-in {
    margin-top: 32px;
    border-left: 4px solid var(--accent);
  }
  .plan {
    font-weight: 600;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
