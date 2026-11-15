<script lang="ts">
  import { caseToOffer, usedIdea, type LaterRecord } from '@chaalwise/core/later';
  import type { Outcome } from '@chaalwise/core/player';
  import { isNewerVersionOpen, openProgress } from '@chaalwise/core/progress';
  import { onMount, tick } from 'svelte';
  import type { LaterCaseData } from '../lib/later-cases';
  import LessonPlayer from './LessonPlayer.svelte';
  import SaveStatus, { type SaveState } from './SaveStatus.svelte';

  /**
   * A case a week later: offered a week after its idea's lesson is finished, it
   * does not say which idea it tests until it is done. Whether the learner used
   * the idea is kept on this device only; nothing is sent.
   */
  let { cases }: { cases: LaterCaseData[] } = $props();
  let offer = $state<LaterCaseData>();
  let playing = $state(false);
  let result = $state<Pick<LaterRecord, 'used' | 'right' | 'of'>>();
  let saved = $state<SaveState>('saving');
  let heading = $state<HTMLElement>();

  onMount(async () => {
    try {
      const progress = await openProgress();
      try {
        offer = caseToOffer(cases, await progress.records('lessons'), await progress.records('later'), new Date());
      } finally {
        progress.close();
      }
    } catch (error) {
      console.error(error);
    }
  });

  async function start() {
    playing = true;
    await tick();
    heading?.focus();
  }

  async function finish(outcomes: Record<string, Outcome>) {
    result = usedIdea(outcomes);
    await save();
  }

  async function save() {
    saved = 'saving';
    try {
      const progress = await openProgress();
      try {
        await progress.recordLater({ caseId: offer!.id, idea: offer!.idea, ...result!, at: new Date() });
      } finally {
        progress.close();
      }
      saved = 'saved';
    } catch (error) {
      console.error(error);
      saved = isNewerVersionOpen(error) ? 'newer' : 'failed';
    }
  }

  const decisions = (n: number) => (n === 1 ? 'the one decision' : n === 2 ? 'both decisions' : `all ${n} decisions`);
</script>

{#if offer}
  <section class="card later" aria-labelledby="later-title" data-testid="later-case">
    <h2 id="later-title" tabindex="-1" bind:this={heading}>A new case: {offer.title}</h2>
    {#if !playing}
      <p>
        A short case with a few decisions, from work, study or everyday life. It does not say which idea it calls for: spotting that is part of it. At the end,
        you see which idea it was.
      </p>
      <button class="button primary" type="button" onclick={start}>Start the case</button>
    {:else}
      <LessonPlayer lesson={{ steps: offer.steps }} onfinish={finish}>
        {#snippet finished()}
          {#if result}
            <div data-testid="later-result">
              <p>
                This case was about <a href={offer!.href}>{offer!.ideaTitle}</a>.
                {#if result.used}
                  You used it without being told: right first time in {decisions(result.of)}.
                {:else}
                  You did not quite use it this time: right first time in {result.right} of {result.of} decisions. Going back to it will help it come to mind next
                  time.
                {/if}
              </p>
              <SaveStatus status={saved} saved="Saved on this device. Your progress page shows how often you used an idea without being told." onretry={save} />
            </div>
          {/if}
        {/snippet}
      </LessonPlayer>
    {/if}
  </section>
{/if}

<style>
  .later {
    margin-top: 32px;
    border-left: 4px solid var(--accent);
  }
  h2:focus {
    outline: none;
  }
</style>
