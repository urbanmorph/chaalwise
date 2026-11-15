<script lang="ts">
  import { calibration } from '@chaalwise/core/calibration';
  import { MIN_ANSWERS, score, settingScores, tellsApart, verdict, type Setting } from '@chaalwise/core/calibration-score';
  import type { Attempt } from '@chaalwise/core/profile';
  import { across, advice, apart, scoreLine, SETTING_NAMES, WHERE } from '../lib/calibration';
  import CalibrationChart from './CalibrationChart.svelte';

  /** The progress page's calibration: the chart, the score over all answers, and a score for each setting once it has enough answers. */
  let { attempts, settings }: { attempts: Attempt[]; settings: Record<string, Setting> } = $props();

  const rows = $derived(calibration(attempts));
  const overall = $derived(score(attempts));
  const bySetting = $derived(settingScores(attempts, (item) => (item ? settings[item] : undefined)));
  const carries = $derived(across(bySetting));
  const tells = $derived(apart(tellsApart(rows)));
</script>

<CalibrationChart {rows} />

{#if overall}
  <p data-testid="calibration-overall"><strong>All settings: {scoreLine(overall)}</strong></p>
{/if}
{#if tells}<p>{tells}</p>{/if}

<h3>By setting</h3>
<p class="lede">
  A score shows once a setting has {MIN_ANSWERS} answers where you said how sure you were: with fewer, it says more about luck than about you.
</p>
<ul class="settings" data-testid="calibration-settings">
  {#each bySetting as row (row.setting)}
    <li class="card" data-setting={row.setting}>
      <h4>{SETTING_NAMES[row.setting]}</h4>
      {#if row.score}
        <p><strong>{scoreLine(row.score)}</strong></p>
        <p>{advice(verdict(row.score), WHERE[row.setting])}</p>
      {:else}
        <p class="lede">{row.answers} of {MIN_ANSWERS} answers so far.</p>
      {/if}
    </li>
  {/each}
</ul>
{#if carries}<p data-testid="calibration-across">{carries}</p>{/if}

<style>
  .lede {
    color: var(--ink-2);
  }
  h3 {
    margin-top: 24px;
  }
  h4 {
    margin: 0 0 6px;
  }
  .settings {
    display: grid;
    gap: 12px;
    padding: 0;
    list-style: none;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 200px), 1fr));
  }
  .settings p {
    margin: 0 0 6px;
  }
</style>
