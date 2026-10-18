<script lang="ts">
  import type { Lesson } from '@chaalwise/core/lesson';
  import type { Outcome } from '@chaalwise/core/player';
  import { openProgress, requestPersistence } from '@chaalwise/core/progress';
  // Loaded with the page, not on demand: if a deploy lands mid-lesson, the
  // on-demand chunk is gone from the server by the time the lesson is saved.
  import '@chaalwise/core/srs';
  import LessonPlayer from './LessonPlayer.svelte';
  import SaveStatus from './SaveStatus.svelte';
  import { summarise } from './outcomes';

  interface Props {
    lesson: Pick<Lesson, 'steps'>;
    lessonId: string;
    next?: { href: string; title: string } | undefined;
  }

  let { lesson, lessonId, next }: Props = $props();
  let saved = $state<'saving' | 'saved' | 'failed'>('saving');
  let outcomes: Record<string, Outcome> = {};

  async function onfinish(result: Record<string, Outcome>) {
    outcomes = result;
    saved = 'saving';
    try {
      const progress = await openProgress();
      await progress.recordLesson(lessonId, outcomes, new Date());
      progress.close();
      saved = 'saved';
      await requestPersistence();
    } catch (error) {
      console.error(error);
      saved = 'failed';
    }
  }
</script>

<LessonPlayer {lesson} {onfinish}>
  {#snippet finished(outcomes)}
    <div class="card done" data-testid="lesson-done">
      <h2>Lesson complete</h2>
      <p>{summarise(outcomes)}.</p>
      <SaveStatus
        status={saved}
        onretry={() => onfinish(outcomes)}
        saved="Saved on this device. These questions come back for review on later days."
      />
      <div class="actions">
        {#if next}
          <a class="button primary" href={next.href}>Next: {next.title}</a>
        {/if}
        <a class="button" href="/chess/">All chess lessons</a>
      </div>
    </div>
  {/snippet}
</LessonPlayer>

<style>
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
</style>
