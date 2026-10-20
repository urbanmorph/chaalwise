<script lang="ts">
  import type { Lesson } from '@chaalwise/core/lesson';
  import { isGraded, type Outcome } from '@chaalwise/core/player';
  import { isNewerVersionOpen, openProgress, requestPersistence } from '@chaalwise/core/progress';
  // Loaded with the page, not on demand: if a deploy lands mid-lesson, the
  // on-demand chunk is gone from the server by the time the lesson is saved.
  import '@chaalwise/core/srs';
  import type { GradedStep } from '@chaalwise/core/lesson';
  import { tick } from 'svelte';
  import { guessChance, logAttempt } from '../lib/attempts';
  import { addDone } from '../lib/done-lessons';
  import { isPracticeKind } from '../lib/practice-kinds';
  import LessonPlayer from './LessonPlayer.svelte';
  import PracticeRound from './PracticeRound.svelte';
  import SaveStatus, { type SaveState } from './SaveStatus.svelte';
  import { summarise } from './outcomes';

  interface Props {
    lesson: Pick<Lesson, 'steps'>;
    lessonId: string;
    next?: { href: string; title: string } | undefined;
    /** The strategy track a plan made in this lesson belongs to. */
    track?: string | undefined;
  }

  let { lesson, lessonId, next, track }: Props = $props();

  async function savePlan(stepId: string, text: string) {
    const progress = await openProgress();
    try {
      await progress.savePlan({ id: `${lessonId}/${stepId}`, track: track ?? '', text, createdAt: new Date() });
    } finally {
      progress.close();
    }
  }
  let saved = $state<SaveState>('saving');
  let outcomes: Record<string, Outcome> = {};

  function logStep(stepId: string, outcome: Outcome) {
    const step = lesson.steps.find((s) => s.id === stepId);
    if (step && isGraded(step)) logAttempt(step.measures, outcome, 'lesson', { item: `${lessonId}/${stepId}`, chance: guessChance(step) });
  }

  /** Steps whose idea can be practised in fresh positions. */
  const practicable = $derived(lesson.steps.filter((s): s is GradedStep => isGraded(s) && !!s.practice && isPracticeKind(s.practice)));
  const ROUND = 5;
  let practice = $state<{ cardId: string; step: GradedStep }[] | undefined>();
  let rounds = $state(0);
  let practiceStart = $state<HTMLElement>();

  /** Five fresh positions of this lesson's ideas, in turn. The generators load only when asked for. */
  async function practiseAgain() {
    const { practiceStep } = await import('../lib/practice');
    practice = Array.from({ length: ROUND }, (_, i) => {
      const source = practicable[i % practicable.length]!;
      const step = practiceStep(source.practice as Parameters<typeof practiceStep>[0], Math.random);
      return { cardId: `${lessonId}/${source.id}`, step: { ...step, measures: source.measures } };
    });
    rounds++;
    await tick();
    practiceStart?.focus();
  }

  async function onfinish(result: Record<string, Outcome>) {
    outcomes = result;
    saved = 'saving';
    try {
      const progress = await openProgress();
      await progress.recordLesson(lessonId, outcomes, new Date());
      progress.close();
      addDone(lessonId);
      saved = 'saved';
      await requestPersistence();
    } catch (error) {
      console.error(error);
      saved = isNewerVersionOpen(error) ? 'newer' : 'failed';
    }
  }
</script>

<LessonPlayer {lesson} {onfinish} onstep={logStep} onplan={savePlan}>
  {#snippet finished(outcomes)}
    <div class="card done" data-testid="lesson-done">
      <h2>Lesson complete</h2>
      <p>{summarise(outcomes)}.</p>
      <SaveStatus status={saved} onretry={() => onfinish(outcomes)} saved="Saved on this device. These questions come back for review on later days." />
      <div class="actions">
        {#if next}
          <a class="button primary" href={next.href}>Next: {next.title}</a>
        {/if}
        {#if practicable.length}
          <button class="button" type="button" onclick={practiseAgain}>Practise again in new positions</button>
        {/if}
        <a class="button" href="/chess/">All chess lessons</a>
      </div>
    </div>
  {/snippet}
</LessonPlayer>

{#if practice}
  <section class="practice" aria-label="Practice in new positions">
    <h2 tabindex="-1" bind:this={practiceStart}>Practice: {ROUND} new positions</h2>
    {#key rounds}
      <PracticeRound items={practice} source="practice">
        {#snippet after()}
          <div class="actions">
            <button class="button" type="button" onclick={practiseAgain}>Another round</button>
            {#if next}<a class="button primary" href={next.href}>Next: {next.title}</a>{/if}
          </div>
        {/snippet}
      </PracticeRound>
    {/key}
  </section>
{/if}

<style>
  .practice {
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid var(--rule);
  }
  .practice h2:focus {
    outline: none;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
</style>
