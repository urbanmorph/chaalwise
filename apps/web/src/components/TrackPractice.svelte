<script lang="ts">
  import type { GradedStep } from '@chaalwise/core/lesson';
  import { levelName } from '@chaalwise/core/profile';
  import { openProgress } from '@chaalwise/core/progress';
  import { onMount, tick } from 'svelte';
  // Loaded with the page, not on demand: see LessonPage.svelte.
  import '@chaalwise/core/srs';
  import { readDone } from '../lib/done-lessons';
  import { askable, gamesMet } from '../lib/games';
  import { buildProfile } from '../lib/profile';
  import { shuffle } from '../lib/random';
  import { roundItems, type RoundItem } from '../lib/round-items';
  import PracticeRound from './PracticeRound.svelte';

  /**
   * A track's practice and review: the learner's level in it, how many of its
   * questions are due, and a short round of its questions in mixed order, from
   * every lesson that trains it, with no lesson needed first. Drawn in full at
   * build time, so the page does not move when the record loads.
   */
  interface Props {
    track: { id: string; name: string };
    /** Every question that trains the track, keyed by card id. */
    steps: Record<string, GradedStep>;
  }

  let { track, steps }: Props = $props();
  // Meet the game first: practise only questions about games played on this device, and about life. On the server, all.
  const met = typeof localStorage === 'undefined' ? undefined : gamesMet(readDone());
  const open = $derived(met ? Object.fromEntries(Object.entries(steps).filter(([id, step]) => askable(id, step, met))) : steps);
  /** A short round: enough to practise, short enough to fit in a break. */
  const ROUND = $derived(Math.min(8, Object.keys(open).length));
  let level = $state('Not started');
  let board = $state('Not started');
  let reason = $state('No tries yet.');
  let due = $state(0);
  let items = $state<RoundItem[]>();
  let rounds = $state(0);
  let heading = $state<HTMLElement>();

  onMount(async () => {
    try {
      const progress = await openProgress();
      const profile = buildProfile(await progress.attemptsBySkill());
      const entry = profile.skills.find((s) => s.skill.id === track.id);
      if (profile.onBoard[track.id]) board = levelName(profile.onBoard[track.id]!.level);
      due = (await progress.dueCards(new Date())).filter((c) => c.id in steps).length;
      progress.close();
      if (entry) [level, reason] = [levelName(entry.assessment.level), entry.assessment.reason];
    } catch (error) {
      console.error(error);
    }
  });

  async function practise() {
    items = await roundItems(shuffle(Object.keys(open)).slice(0, ROUND), open);
    rounds++;
    await tick();
    heading?.focus();
  }
</script>

<div class="card status" data-practice-count={Object.keys(steps).length}>
  <dl>
    <div>
      <dt>Your level</dt>
      <dd data-testid="track-level">{level}</dd>
    </div>
    <div>
      <dt>On the board</dt>
      <dd data-testid="track-board">{board}</dd>
    </div>
    <div>
      <dt>Due for review</dt>
      <dd data-testid="track-due">{due}</dd>
    </div>
  </dl>
  <p class="reason">{reason}</p>
  <div class="actions">
    {#if ROUND}
      <button class="button primary" onclick={practise}>Practise {ROUND} questions</button>
    {:else}
      <!-- Every question here is about a game not met yet: meet it first. -->
      <a class="button primary" href="/chess/first-moves/">Play your first moves first</a>
    {/if}
    <a class="button" href="/review/?track={track.id}">Review {track.name} questions</a>
  </div>
</div>

{#if items}
  {#key rounds}
    <h3 tabindex="-1" bind:this={heading}>Practice: {track.name}</h3>
    <PracticeRound {items} source="practice">
      {#snippet after()}
        <button class="button primary" onclick={practise}>Practise {ROUND} more</button>
      {/snippet}
    </PracticeRound>
  {/key}
{/if}

<style>
  dl {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 40px;
    margin: 0 0 4px;
  }
  dt {
    color: var(--ink-2);
    font-size: 0.85rem;
  }
  dd {
    margin: 2px 0 0;
    font-size: 1.4rem;
    font-weight: 600;
  }
  .reason {
    color: var(--ink-2);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
  h3 {
    margin-top: 24px;
  }
  h3:focus {
    outline: none;
  }
</style>
