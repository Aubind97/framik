<script lang="ts">
  let {enabled}: {enabled?: boolean | undefined} = $props();
</script>

<span class="relative flex size-3">
    <span class="absolute inline-flex h-full w-full rounded-full opacity-75 {enabled ? 'bg-sky-400 animate-ping' : ''}"></span>
    <span class="relative inline-flex size-3 rounded-full {enabled ? 'bg-sky-500' : 'bg-muted'}"></span>
</span>
