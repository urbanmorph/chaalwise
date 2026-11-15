<script lang="ts">
  import type { CalibrationRow } from '@chaalwise/core/calibration';

  /**
   * For each level of sureness, how often the answers were right, as a bar on
   * one 0 to 100% axis, with a line where a well-judged bar would end (at the
   * level said). Every bar carries its value, and the same figures show as a table.
   */
  let { rows }: { rows: readonly CalibrationRow[] } = $props();
  const pct = (share: number) => `${Math.round(share * 100)}%`;
</script>

<figure class="chart">
  <figcaption>
    <span class="label">When you said…, you were right</span>
    <span class="key"><span class="mark" aria-hidden="true"></span> the line marks a perfect judge: right as often as they said</span>
  </figcaption>
  <ul>
    {#each rows as row (row.confidence)}
      <li>
        <span class="said">{pct(row.confidence)} sure</span>
        <span class="track" aria-hidden="true">
          {#if row.answers}<span class="bar" style="width: {(row.right / row.answers) * 100}%"></span>{/if}
          <span class="target" style="left: {row.confidence * 100}%"></span>
        </span>
        <span class="value">{row.answers ? `${pct(row.right / row.answers)}, ${row.right} of ${row.answers}` : 'No answers yet'}</span>
      </li>
    {/each}
  </ul>
  <div class="axis" aria-hidden="true"><span>0%</span><span>50%</span><span>100%</span></div>
  <details>
    <summary>Show as a table</summary>
    <table data-testid="calibration">
      <thead><tr><th scope="col">You said</th><th scope="col">Answers</th><th scope="col">Right first time</th></tr></thead>
      <tbody>
        {#each rows as row (row.confidence)}
          <tr>
            <th scope="row">{pct(row.confidence)} sure</th>
            <td>{row.answers}</td>
            <td>{row.answers ? pct(row.right / row.answers) : '–'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </details>
</figure>

<style>
  .chart {
    margin: 12px 0 0;
  }
  figcaption {
    display: grid;
    gap: 2px;
    margin-bottom: 8px;
  }
  .label {
    font-weight: 600;
  }
  .key {
    color: var(--ink-2);
    font-size: 0.9rem;
  }
  .mark {
    display: inline-block;
    width: 2px;
    height: 0.9em;
    vertical-align: -0.1em;
    background: var(--ink);
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 10px;
  }
  li,
  .axis {
    display: grid;
    grid-template-columns: 5.5rem 1fr;
    column-gap: 10px;
    align-items: center;
  }
  .said {
    color: var(--ink);
  }
  .track {
    position: relative;
    height: 14px;
    border-radius: 4px;
    background: var(--rule);
  }
  .bar {
    position: absolute;
    inset: 0 auto 0 0;
    border-radius: 4px;
    background: var(--chart-1);
  }
  .target {
    position: absolute;
    top: -4px;
    bottom: -4px;
    width: 2px;
    margin-left: -1px;
    background: var(--ink);
  }
  .value {
    grid-column: 2;
    color: var(--ink-2);
    font-size: 0.9rem;
    font-variant-numeric: tabular-nums;
  }
  .axis {
    margin-top: 6px;
    color: var(--ink-2);
    font-size: 0.8rem;
  }
  .axis span:first-child {
    grid-column: 2;
    grid-row: 1;
  }
  .axis span:nth-child(2) {
    grid-column: 2;
    grid-row: 1;
    text-align: center;
  }
  .axis span:last-child {
    grid-column: 2;
    grid-row: 1;
    text-align: right;
  }
  details {
    margin: 8px 0 12px;
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
    padding: 6px 8px 6px 0;
    border-bottom: 1px solid var(--rule);
    color: var(--ink);
  }
  thead th {
    font-size: 0.9rem;
    color: var(--ink-2);
  }
</style>
