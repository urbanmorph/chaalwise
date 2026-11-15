<script lang="ts">
  import { planSentence, planToAsk, splitPlan, type CheckInResult, type PlanRecord } from '@chaalwise/core/plans';
  import type { ProgressStore } from '@chaalwise/core/progress';
  import { onMount } from 'svelte';
  import { count } from '../lib/count';
  import { withProgress } from '../lib/with-progress';

  /**
   * The check-in for the oldest plan that is ready to ask about, one at a time. It asks
   * first whether the moment came and was noticed, as missing it is the usual failure,
   * and only then whether the plan was acted on. A moment missed offers to change the
   * plan's "When …" part. Each answer is counted by its name alone (lib/count.ts).
   */
  let plan = $state<PlanRecord>();
  let asked = $state<'notice' | 'act' | 'done'>('notice');
  let answer = $state<CheckInResult>();
  let editing = $state(false);
  let when = $state('');
  let changed = $state(false);

  const parts = $derived(plan && splitPlan(plan.text));
  const sentence = $derived(parts && when.trim() ? planSentence(when, parts.action) : '');

  onMount(async () => {
    try {
      plan = planToAsk(await withProgress((p) => p.plans()), new Date());
    } catch (error) {
      console.error(error);
    }
  });

  /** Save on the device before replying, so leaving straight away cannot lose the answer. */
  async function save(write: (progress: ProgressStore) => Promise<void>) {
    try {
      await withProgress(write);
    } catch (error) {
      console.error(error);
    }
  }

  async function noticed(result: 'noticed' | 'not-noticed' | 'no-chance') {
    await save((p) => p.checkInPlan(plan!.id, result, new Date()));
    if (result === 'noticed') count('checkin:noticed');
    if (result === 'not-noticed') count('checkin:not-noticed');
    answer = result;
    asked = result === 'noticed' ? 'act' : 'done';
  }

  async function acted(yes: boolean) {
    if (yes) {
      await save((p) => p.amendCheckIn(plan!.id, 'acted'));
      count('checkin:acted');
      answer = 'acted';
    }
    asked = 'done';
  }

  function goOver() {
    when = parts!.situation;
    editing = true;
  }

  /** The changed plan keeps its date and check-ins, so it is asked about again a week from now. */
  async function saveChange() {
    const { id, track, createdAt } = plan!;
    await save((p) => p.savePlan({ id, track, createdAt, text: sentence }));
    changed = true;
    editing = false;
  }

  const REPLY: Partial<Record<CheckInResult, string>> = {
    acted: 'Good. Was it a good decision, whatever the result? That is the part to judge.',
    noticed: 'Noticing is the hard part, and you did it. Next time, take the first small step at once. You will be asked again in a week.',
    'not-noticed':
      'That is the usual way a plan fails: the moment passes before you spot it. A plan works best when its “When …” part names something you will see or hear.',
    'no-chance': 'You will be asked again in a week.',
  };
</script>

{#if plan}
  <section class="card check-in" aria-labelledby="check-in-title" data-testid="plan-check-in">
    <h2 id="check-in-title">Did the moment come up, and did you notice it?</h2>
    <p class="plan">Your plan: {plan.text}</p>
    {#if asked === 'notice'}
      <div class="actions">
        <button class="button" type="button" onclick={() => noticed('noticed')}>Yes, I noticed it</button>
        <button class="button" type="button" onclick={() => noticed('not-noticed')}>It came, but I did not notice in time</button>
        <button class="button" type="button" onclick={() => noticed('no-chance')}>It has not come up yet</button>
      </div>
    {:else if asked === 'act'}
      <p>Did you act on your plan?</p>
      <div class="actions">
        <button class="button" type="button" onclick={() => acted(true)}>Yes, I did</button>
        <button class="button" type="button" onclick={() => acted(false)}>No, not this time</button>
      </div>
    {:else if answer}
      <p aria-live="polite">{REPLY[answer]}</p>
      {#if answer === 'not-noticed' && parts}
        {#if editing}
          <label class="when">When <input type="text" bind:value={when} /></label>
          <p class="plan" aria-live="polite">{sentence}</p>
          <button class="button primary" type="button" disabled={!sentence} onclick={saveChange}>Save my plan</button>
        {:else if changed}
          <p aria-live="polite">Saved. You will be asked again in a week.</p>
        {:else}
          <button class="button" type="button" onclick={goOver}>Change the “When …” part</button>
        {/if}
      {/if}
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
  .when {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .when input {
    flex: 1;
    min-width: 0;
    font: inherit;
    padding: 4px 8px;
    border: 1px solid var(--rule-strong);
    border-radius: var(--radius);
    background: var(--paper);
    color: var(--ink);
  }
</style>
