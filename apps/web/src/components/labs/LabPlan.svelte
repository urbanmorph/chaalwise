<script lang="ts">
  import type { LabPlan } from '../../lib/labs/plans';
  import { keepPlan } from '../../lib/plans';
  import PlanStep from '../PlanStep.svelte';

  /** A lab's plan step, after its debrief: saved as `labs/<slug>/plan`, so review asks "did you use it?" as for a lesson's. */
  let { slug, track, plan }: { slug: string; track: string; plan: LabPlan } = $props();
</script>

<PlanStep situations={plan.situations} action={plan.action} onsave={(text) => keepPlan(`labs/${slug}/plan`, track, text)} />
