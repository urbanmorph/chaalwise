<script lang="ts">
  import type { GradedStep, Step } from '@chaalwise/core/lesson';
  import { count } from '../lib/count';
  import { isGraded, type Outcome } from '@chaalwise/core/player';
  import { isNewerVersionOpen, openProgress, requestPersistence } from '@chaalwise/core/progress';
  // Loaded with the page, not on demand: if a deploy lands mid-lesson, the
  // on-demand chunk is gone from the server by the time the lesson is saved.
  import '@chaalwise/core/srs';
  import { tick, untrack } from 'svelte';
  import { guessChance, logAttempt } from '../lib/attempts';
  import { afterCheck } from '../lib/check-result';
  import { addDone, readDone } from '../lib/done-lessons';
  import { gamesMet, needs, workedExample } from '../lib/games';
  import { isPracticeKind } from '../lib/practice-kinds';
  import { clearResume, readResume, saveResume } from '../lib/resume';
  import { practiceOf, roundItems } from '../lib/round-items';
  import LessonPlayer from './LessonPlayer.svelte';
  import PracticeRound from './PracticeRound.svelte';
  import SaveStatus, { type SaveState } from './SaveStatus.svelte';
  import { summarise } from './outcomes';

  interface Props {
    lesson: { steps: Step[] };
    lessonId: string;
    next?: { href: string; title: string } | undefined;
    /** The strategy track a plan made in this lesson belongs to. */
    track?: string | undefined;
    /** Offer "already know this?": a check of the questions only, for learners who know the game. */
    checkable?: boolean;
    /** A strategy lesson: until chess is met, its board questions are worked examples to read. */
    workedUntilMet?: boolean;
    /** Where all the lessons of this course are listed. */
    all?: { href: string; label: string; done: string };
  }

  let {
    lesson,
    lessonId,
    next,
    track,
    checkable = false,
    workedUntilMet = false,
    all = { href: '/chess/', label: 'All chess lessons', done: 'Lesson complete' },
  }: Props = $props();

  /**
   * Where the learner left this lesson, read at once: the page drew the offer to
   * carry on before its first paint (LessonArticle), so it is there from the start.
   */
  const stepIds = $derived(lesson.steps.map((s) => s.id));
  // Read once, as the page opens: moving on later keeps the place, it does not offer it again.
  let left = $state(typeof localStorage === 'undefined' ? undefined : untrack(() => readResume(lessonId, stepIds)));
  let player = $state<LessonPlayer>();

  function carryOn() {
    if (left) player?.resume(left.index, left.outcomes);
    left = undefined;
  }

  function startAgain() {
    clearResume(lessonId);
    left = undefined;
  }

  /** Keep the learner's place as they go. Moving on in the lesson answers the offer: the place is now here. */
  function keepPlace(index: number, outcomes: Record<string, Outcome>) {
    left = undefined;
    saveResume(lessonId, stepIds, index, outcomes);
  }

  // Meet the game first. Read from the quick copy, so the lesson is right from the start; on the server, every question shows.
  const chessMet = typeof localStorage === 'undefined' || gamesMet(readDone()).has('chess');
  const played = $derived(
    workedUntilMet && !chessMet ? { steps: lesson.steps.map((s) => (isGraded(s) && needs(s.id, s) === 'chess' ? workedExample(s) : s)) } : lesson,
  );

  /**
   * The check: the lesson's questions without the reading, in fresh positions
   * where a generator exists. All right first time, and the lesson counts as
   * done; otherwise the lesson itself follows (the expertise reversal effect:
   * worked steps help newcomers and slow down those who know it already).
   */
  let mode = $state<'lesson' | 'check' | 'passed' | 'not-yet'>('lesson');
  let check = $state<GradedStep[]>([]);

  async function takeCheck() {
    const graded = played.steps.filter(isGraded);
    const items = await roundItems(
      graded.map((s) => s.id),
      Object.fromEntries(graded.map((s) => [s.id, s])),
    );
    check = items.map(({ cardId, step }) => ({ ...step, id: cardId }));
    mode = 'check';
  }

  /** The check's answers, kept in the lesson that follows a miss: the questions right first time need not be answered again. */
  let checked = $state<ReturnType<typeof afterCheck> & { result: Record<string, Outcome> }>();

  async function checkDone(result: Record<string, Outcome>) {
    const passed = Object.values(result).every((o) => o === 'first-try');
    mode = passed ? 'passed' : 'not-yet';
    if (passed) return onfinish(result);
    checked = { ...afterCheck(played.steps, result), result };
    await tick();
    player?.resume(checked.start, result, false);
  }

  const stepList = (steps: number[]) => (steps.length === 1 ? `step ${steps[0]}` : `steps ${steps.slice(0, -1).join(', ')} and ${steps.at(-1)}`);

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
    const step = played.steps.find((s) => s.id === stepId);
    if (step && isGraded(step)) logAttempt(step.measures, outcome, 'lesson', { item: stepId, chance: guessChance(step) });
  }

  /** Steps whose idea can be practised in fresh positions. */
  const practicable = $derived(played.steps.filter((s): s is GradedStep => isGraded(s) && isPracticeKind(practiceOf(s) ?? '')));
  const ROUND = 5;
  let practice = $state<{ cardId: string; step: GradedStep }[] | undefined>();
  let rounds = $state(0);
  let practiceStart = $state<HTMLElement>();

  /** Five fresh positions of this lesson's ideas, in turn. The generators load only when asked for. */
  async function practiseAgain() {
    const { practiceStep } = await import('../lib/practice');
    practice = Array.from({ length: ROUND }, (_, i) => {
      const source = practicable[i % practicable.length]!;
      const step = practiceStep(practiceOf(source) as Parameters<typeof practiceStep>[0], Math.random);
      return { cardId: source.id, step: { ...step, measures: source.measures } };
    });
    rounds++;
    await tick();
    practiceStart?.focus();
  }

  async function onfinish(result: Record<string, Outcome>) {
    outcomes = result;
    saved = 'saving';
    clearResume(lessonId);
    try {
      const progress = await openProgress();
      await progress.recordLesson(lessonId, outcomes, new Date());
      progress.close();
      addDone(lessonId);
      count(`finished:${lessonId}`);
      saved = 'saved';
      await requestPersistence();
    } catch (error) {
      console.error(error);
      saved = isNewerVersionOpen(error) ? 'newer' : 'failed';
    }
  }
</script>

<div class="card resume" data-testid="resume" data-resume hidden={!left}>
  <p>You were part-way through this lesson, at step <span data-resume-step>{(left?.index ?? 0) + 1}</span> of {lesson.steps.length}.</p>
  <div class="actions">
    <button class="button primary" type="button" onclick={carryOn}>Carry on</button>
    <button class="button" type="button" onclick={startAgain}>Start again</button>
  </div>
</div>

{#if checkable && mode === 'lesson'}
  <div class="card check">
    <p><strong>Already know this?</strong> Take the check: just the questions, no reading. Get them all right first time and the lesson counts as done.</p>
    <button class="button" type="button" onclick={takeCheck}>Take the check</button>
  </div>
{/if}

{#if mode === 'check'}
  <LessonPlayer lesson={{ steps: check }} onfinish={checkDone} onstep={logStep}>
    {#snippet finished()}{/snippet}
  </LessonPlayer>
{:else if mode === 'passed'}
  <div class="card done" data-testid="check-passed">
    <h2>You know this one</h2>
    <SaveStatus status={saved} onretry={() => onfinish(outcomes)} saved="Saved on this device. These questions come back for review on later days." />
    <div class="actions">
      {#if next}<a class="button primary" href={next.href}>Next: {next.title}</a>{/if}
      <a class="button" href={all.href}>{all.label}</a>
    </div>
  </div>
{:else}
  {#if mode === 'not-yet' && checked}
    <div class="card not-yet" role="status" data-testid="check-missed">
      <p>
        Not quite: {checked.right} of {checked.total} right first time. The {checked.missed.length === 1 ? 'one' : 'ones'} to work on: {stepList(
          checked.missed,
        )}, marked on the steps below. The lesson opens at {checked.start + 1 < checked.missed[0]!
          ? `step ${checked.start + 1}, the reading before it`
          : `step ${checked.missed[0]}`}. The questions you got right still count, so you can move past them.
      </p>
      {#if checked.start > 0}
        <button class="button" type="button" onclick={() => player?.resume(0, checked!.result, false)}>Start from the beginning</button>
      {/if}
    </div>
  {/if}
  <LessonPlayer bind:this={player} lesson={played} {onfinish} onstep={logStep} onplan={savePlan} onprogress={keepPlace}>
    {#snippet finished(outcomes)}
      <div class="card done" data-testid="lesson-done">
        <h2>{all.done}</h2>
        <p>{summarise(outcomes)}.</p>
        <SaveStatus status={saved} onretry={() => onfinish(outcomes)} saved="Saved on this device. These questions come back for review on later days." />
        <div class="actions">
          {#if next}
            <a class="button primary" href={next.href}>Next: {next.title}</a>
          {/if}
          {#if practicable.length}
            <button class="button" type="button" onclick={practiseAgain}>Practise again in new positions</button>
          {/if}
          <a class="button" href={all.href}>{all.label}</a>
        </div>
      </div>
    {/snippet}
  </LessonPlayer>
{/if}

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
  .resume,
  .check,
  .not-yet {
    margin-bottom: 16px;
  }
  .resume[hidden] {
    display: none;
  }
  .resume p,
  .check p,
  .not-yet p {
    margin-top: 0;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
</style>
