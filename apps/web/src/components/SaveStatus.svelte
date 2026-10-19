<script lang="ts">
  /** Whether a finished lesson or review has been saved on the device, with a way forward if not. */
  export type SaveState = 'saving' | 'saved' | 'failed' | 'newer';

  let { status, saved, onretry }: { status: SaveState; saved: string; onretry: () => void } = $props();
</script>

<p role="status">
  {#if status === 'saved'}
    {saved}
  {:else if status === 'newer'}
    A newer version of Chaalwise is open in another tab. Reload this page to save your progress.
    <button class="button" type="button" onclick={() => location.reload()}>Reload</button>
  {:else if status === 'failed'}
    Your progress could not be saved on this device.
    <button class="button" type="button" onclick={onretry}>Try again</button>
  {:else}
    Saving…
  {/if}
</p>
