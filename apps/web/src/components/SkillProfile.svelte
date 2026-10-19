<script lang="ts">
  import { LEVELS, levelName } from '@chaalwise/core/profile';
  import { openProgress, type AttemptRecord } from '@chaalwise/core/progress';
  import { onMount } from 'svelte';
  import { CHART_SKILLS, dashboard, radarPoint } from '../lib/dashboard';
  import { buildProfile } from '../lib/profile';

  /**
   * The skill dashboard: a period filter, three stat tiles, a radar of
   * first-time rates by skill, what is due for review, improvement areas, and
   * a card per skill. All from this device's own record. It starts from the
   * empty record, so the page is laid out in full from the first paint.
   */
  let { cardIds }: { cardIds: string[] } = $props();

  const PERIODS = [
    { days: 7, label: '7 days' },
    { days: 30, label: '30 days' },
    { days: undefined, label: 'All time' },
  ] as const;

  let attempts = $state<Record<string, AttemptRecord[]>>({});
  let period = $state<number | undefined>(30);
  let due = $state(0);
  let failed = $state(false);
  let active = $state<string>();

  const profile = $derived(buildProfile(attempts));
  const stats = $derived(dashboard(attempts, period));
  const percent = (rate: number | undefined) => (rate === undefined ? '–' : `${Math.round(rate * 100)}%`);

  /** The first three skills to work on: the next focus, then the next weakest (or the next to start). */
  const improve = $derived(profile.ranked.slice(0, 3));

  onMount(async () => {
    try {
      const progress = await openProgress();
      attempts = await progress.attemptsBySkill();
      const known = new Set(cardIds);
      due = (await progress.dueCards(new Date())).filter((c) => known.has(c.id)).length;
      progress.close();
    } catch (error) {
      console.error(error);
      failed = true;
    }
  });

  // The radar: axes, rings at a quarter steps, and the learner's shape.
  // The drawing is centred on 0,0, W by H units; labels sit just outside the outer ring.
  const R = 115;
  const W = 420;
  const H = 300;
  const n = CHART_SKILLS.length;
  const ring = (value: number) =>
    CHART_SKILLS.map((_, i) => radarPoint(i, n, value, R))
      .map((p) => `${p.x},${p.y}`)
      .join(' ');
  const shape = $derived(stats.skills.map((s, i) => radarPoint(i, n, s.rate ?? 0, R)));
  const anchor = (x: number) => (Math.abs(x) < 1 ? 'middle' : x > 0 ? 'start' : 'end');
  const tip = $derived(stats.skills.find((s) => s.id === active));
  const tipAt = $derived(active ? shape[stats.skills.findIndex((s) => s.id === active)] : undefined);
  const statsFor = (id: string) => stats.skills.find((s) => s.id === id);
</script>

{#if failed}
  <p>Your skill profile could not be read on this device.</p>
{/if}

<div class="choices" role="radiogroup" aria-label="Period">
  {#each PERIODS as p (p.label)}
    <label>
      <input type="radio" name="period" checked={period === p.days} onchange={() => (period = p.days)} />
      {p.label}
    </label>
  {/each}
</div>

<section class="card board" aria-labelledby="dash-title">
  <h2 id="dash-title" class="sr-only">Your practice in this period</h2>
  <dl class="tiles">
    <div>
      <dt>Questions tried</dt>
      <dd data-testid="tile-tries">{stats.tries}</dd>
    </div>
    <div>
      <dt>First time</dt>
      <dd data-testid="tile-rate">{percent(stats.firstTimeRate)}</dd>
    </div>
    <div>
      <dt>Days practised</dt>
      <dd>{stats.daysPractised}</dd>
    </div>
  </dl>

  <figure class="radar">
    <figcaption>
      <span class="label">First time, by skill</span> <span class="lede">Further out is better. A skill not tried yet sits at the centre.</span>
    </figcaption>
    <div class="plot">
      <svg
        viewBox="{-W / 2} {-H / 2} {W} {H}"
        role="img"
        aria-label="Radar chart of the share of questions answered first time in each skill. The same figures are in the table below."
      >
        {#each [0.25, 0.5, 0.75, 1] as r (r)}<polygon class="grid" points={ring(r)} />{/each}
        {#each CHART_SKILLS as skill, i (skill.id)}
          {@const end = radarPoint(i, n, 1, R)}
          <line class="grid" x1="0" y1="0" x2={end.x} y2={end.y} />
        {/each}
        <text class="scale" x="-6" y={-R * 0.5 + 4} text-anchor="end">50%</text>
        <text class="scale" x="-6" y={-R + 4} text-anchor="end">100%</text>
        <polygon class="area" points={shape.map((p) => `${p.x},${p.y}`).join(' ')} />
        {#each stats.skills as s, i (s.id)}
          {@const label = radarPoint(i, n, 1.14, R)}
          <text class="axis" x={label.x} y={label.y + 4} text-anchor={anchor(label.x)}>{s.short}</text>
          {#if s.rate !== undefined}
            <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
            <g
              class="point"
              tabindex="0"
              role="img"
              aria-label="{s.name}: {percent(s.rate)} first time, {s.firstTry} of {s.tries}"
              onpointerenter={() => (active = s.id)}
              onpointerleave={() => (active = undefined)}
              onfocus={() => (active = s.id)}
              onblur={() => (active = undefined)}
            >
              <circle class="hit" cx={shape[i]!.x} cy={shape[i]!.y} r="14" />
              <circle class="dot" cx={shape[i]!.x} cy={shape[i]!.y} r="5" />
            </g>
          {/if}
        {/each}
      </svg>
      {#if tip && tipAt}
        <div class="tooltip" style="left: {50 + (tipAt.x / W) * 100}%; top: {50 + (tipAt.y / H) * 100}%" aria-hidden="true">
          <strong>{percent(tip.rate)} first time</strong>
          <span>{tip.name} · {tip.firstTry} of {tip.tries}</span>
        </div>
      {/if}
    </div>
    <details>
      <summary>Show as a table</summary>
      <table>
        <thead><tr><th scope="col">Skill</th><th scope="col">Tried</th><th scope="col">First time</th></tr></thead>
        <tbody>
          {#each stats.skills as s (s.id)}
            <tr><th scope="row">{s.name}</th><td>{s.tries}</td><td>{percent(s.rate)}</td></tr>
          {/each}
        </tbody>
      </table>
    </details>
  </figure>

  <a class="replay" href="/review/" data-testid="due">▶ {due} {due === 1 ? 'question' : 'questions'} due for review</a>
</section>

<h2>Improvement areas</h2>
<p class="lede">Train these next. Your next focus is first.</p>
<ul class="improve">
  {#each improve as { skill, assessment }, i (skill.id)}
    {@const s = statsFor(skill.id)}
    <li class="card" class:focus={i === 0} data-testid={i === 0 ? 'next-focus' : undefined}>
      <h3>{skill.name}</h3>
      <p class="means">{skill.means}</p>
      <dl class="mini">
        <div>
          <dt>Level</dt>
          <dd>{levelName(assessment.level)}</dd>
        </div>
        <div>
          <dt>Tried</dt>
          <dd>{s?.tries ?? 0}</dd>
        </div>
        <div>
          <dt>First time</dt>
          <dd>{percent(s?.rate)}</dd>
        </div>
      </dl>
      <a class="button" class:primary={i === 0} href={skill.practise.href}>Practise: {skill.practise.label}</a>
    </li>
  {/each}
</ul>

<h2 class="heading">Your skills</h2>
<p class="lede">
  Each level comes from your own last 20 answers in that skill: Noticing, Applying, Reliable, Instinctive. Levels go down as well as up, and never compare you
  with anyone else.
</p>
<ul class="skills">
  {#each profile.skills as { skill, assessment } (skill.id)}
    <li class="card" data-skill={skill.id}>
      <h3>{skill.name}</h3>
      <p class="level">
        <span class="label">{levelName(assessment.level)}</span>
        <span class="meter" aria-hidden="true">
          {#each [1, 2, 3, 4] as step (step)}<span class:on={LEVELS.indexOf(assessment.level) >= step}></span>{/each}
        </span>
      </p>
      <p class="means">{skill.means}</p>
      <!-- Always both lines, so a card keeps its size when the record loads. -->
      <p class="evidence">{assessment.reason}</p>
      <p class="next">{skill.later && assessment.level === 'not-started' ? skill.later : (assessment.next ?? 'The top level. Keep it there.')}</p>
      <a href={skill.practise.href}>{skill.practise.label}</a>
    </li>
  {/each}
</ul>

<style>
  .choices {
    margin-bottom: 12px;
  }
  .board {
    margin-bottom: 32px;
  }
  .tiles {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin: 0;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--rule);
  }
  .tiles div {
    text-align: center;
  }
  .tiles dt {
    color: var(--ink-2);
    font-size: 0.9rem;
  }
  .tiles dd {
    margin: 4px 0 0;
    font-size: clamp(1.6rem, 4vw, 2.2rem);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  figcaption .lede {
    display: block;
    margin-top: 4px;
  }
  .radar {
    margin: 16px 0 0;
  }
  .plot {
    position: relative;
    max-width: 560px;
    margin: 0 auto;
  }
  svg {
    width: 100%;
    height: auto;
    overflow: visible;
  }
  .grid {
    fill: none;
    stroke: var(--rule-strong);
    stroke-opacity: 0.45;
    stroke-width: 1;
  }
  .scale {
    fill: var(--ink-2);
    font-size: 11px;
  }
  .axis {
    fill: var(--ink);
    font-size: 14px;
  }
  .area {
    fill: color-mix(in srgb, var(--chart-1) 12%, transparent);
    stroke: var(--chart-1);
    stroke-width: 2;
    stroke-linejoin: round;
  }
  .point {
    cursor: default;
    outline: none;
  }
  .hit {
    fill: transparent;
  }
  .dot {
    fill: var(--chart-1);
    stroke: var(--card);
    stroke-width: 2;
  }
  .point:hover .dot,
  .point:focus-visible .dot {
    r: 7;
  }
  .point:focus-visible .hit {
    stroke: var(--focus);
    stroke-width: 2;
  }
  .tooltip {
    position: absolute;
    transform: translate(-50%, calc(-100% - 14px));
    display: grid;
    gap: 2px;
    padding: 6px 10px;
    background: var(--paper);
    border: 1px solid var(--rule-strong);
    border-radius: 8px;
    font-size: 0.85rem;
    white-space: nowrap;
    pointer-events: none;
    box-shadow: var(--shadow);
  }
  .tooltip span {
    color: var(--ink-2);
  }
  details {
    margin-top: 8px;
    color: var(--ink-2);
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8px;
    font-variant-numeric: tabular-nums;
  }
  th,
  td {
    text-align: left;
    padding: 4px 8px;
    border-bottom: 1px solid var(--rule);
    color: var(--ink);
  }
  .replay {
    display: block;
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid var(--rule);
    text-align: center;
    color: var(--accent-text);
    font-weight: 600;
    text-decoration: none;
  }
  .lede {
    color: var(--ink-2);
  }
  .improve,
  .skills {
    display: grid;
    gap: 12px;
    padding: 0;
    list-style: none;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
  }
  .improve {
    margin-bottom: 32px;
  }
  .improve .focus {
    border-left: 4px solid var(--accent);
  }
  .mini {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    margin: 0 0 12px;
  }
  .mini dt {
    color: var(--ink-2);
    font-size: 0.8rem;
  }
  .mini dd {
    margin: 2px 0 0;
    font-weight: 600;
  }
  h3 {
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
