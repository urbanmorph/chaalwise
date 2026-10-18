<script lang="ts">
  /** Whether a finished lesson or review has been saved on the device, with a retry if not. */
  let {
    status,
    saved,
    onretry,
  }: { status: 'saving' | 'saved' | 'failed'; saved: string; onretry: () => void } = $props();
</script>

<p role="status">
  {#if status === 'saved'}
    {saved}
  {:else if status === 'failed'}
    Your progress could not be saved on this device.
    <button class="button" type="button" onclick={onretry}>Try again</button>
  {:else}
    Saving…
  {/if}
</p>
