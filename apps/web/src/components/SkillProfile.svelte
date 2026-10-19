<script lang="ts">
  import { LEVELS, levelName } from '@chaalwise/core/profile';
  import { openProgress } from '@chaalwise/core/progress';
  import { onMount } from 'svelte';
  import { buildProfile } from '../lib/profile';

  /** The skill profile: a level per skill from this device's own record, with the evidence and what comes next. */
  let profile = $state<ReturnType<typeof buildProfile>>();
  let failed = $state(false);

  onMount(async () => {
    try {
      const progress = await openProgress();
      const attempts = await progress.attemptsBySkill();
      progress.close();
      profile = buildProfile(attempts);
    } catch (error) {
      console.error(error);
      failed = true;
    }
  });

  /** Noticing to Instinctive as 1 to 4. */
  const step = (level: string) => Math.max(0, LEVELS.indexOf(level as (typeof LEVELS)[number]));
</script>

{#if failed}
  <p>Your skill profile could not be read on this device.</p>
{:else if profile}
  {#if profile.focus}
    <section class="card focus" aria-labelledby="focus-title" data-testid="next-focus">
      <p class="label">Next focus</p>
      <h2 id="focus-title">{profile.focus.skill.name}</h2>
      <p>{profile.focus.skill.means}</p>
      {#if profile.focus.assessment.level !== 'not-started'}<p class="evidence">{profile.focus.assessment.reason}</p>{/if}
      <a class="button primary" href={profile.focus.skill.practise.href}>Practise: {profile.focus.skill.practise.label}</a>
    </section>
  {/if}

  <h2 class="heading">Your skills</h2>
  <p class="lede">
    Each level comes from your own recent answers on this device: Noticing, Applying, Reliable, Instinctive. Levels go down as well as up, and never compare you
    with anyone else.
  </p>
  <ul class="skills">
    {#each profile.skills as { skill, assessment } (skill.id)}
      <li class="card" data-skill={skill.id}>
        <h3>{skill.name}</h3>
        <p class="level">
          <span class="label">{levelName(assessment.level)}</span>
          <span class="meter" aria-hidden="true">
            {#each [1, 2, 3, 4] as n (n)}<span class:on={step(assessment.level) >= n}></span>{/each}
          </span>
        </p>
        <p class="means">{skill.means}</p>
        {#if assessment.level !== 'not-started'}
          <p class="evidence">{assessment.reason}</p>
          {#if assessment.next}<p class="next">{assessment.next}</p>{/if}
        {:else if skill.later}
          <p class="next">{skill.later}</p>
        {/if}
        <a href={skill.practise.href}>{skill.practise.label}</a>
      </li>
    {/each}
  </ul>
{:else}
  <p>Reading your skill profile…</p>
{/if}

<style>
  .focus {
    border-left: 4px solid var(--accent);
    margin-bottom: 28px;
  }
  .focus h2 {
    margin-bottom: 6px;
  }
  .heading {
    margin-top: 8px;
  }
  .lede {
    color: var(--ink-2);
  }
  .skills {
    display: grid;
    gap: 12px;
    padding: 0;
    list-style: none;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
  }
  .skills h3 {
    margin-bottom: 4px;
  }
  .level {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin: 0 0 8px;
  }
  .meter {
    display: inline-flex;
    gap: 3px;
  }
  .meter span {
    width: 18px;
    height: 6px;
    border-radius: 3px;
    background: var(--rule);
  }
  .meter span.on {
    background: var(--pass);
  }
  .means,
  .next {
    color: var(--ink-2);
    margin-bottom: 8px;
  }
  .evidence {
    margin-bottom: 8px;
  }
</style>
